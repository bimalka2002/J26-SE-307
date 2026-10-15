"""
ELP inference service — oral leukoplakia + erythroplakia (single 3-class model).

Teammates can add /predict/olp, /predict/osmf, /predict/caries beside this.
Until a trained checkpoint is placed under saved_models/, /predict/elp runs in stub mode.
"""

from __future__ import annotations

import hashlib
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

LOG = logging.getLogger(__name__)
APP_DIR = Path(__file__).resolve().parent
MODEL_DIR = APP_DIR / "saved_models"
MAX_IMAGE_BYTES = 10 * 1024 * 1024

MODEL_SPECS = {
    "elp": {
        "filename": "leukoplakia_erythroplakia/model.keras",
        "modality": "oral_photo",
        "classes": ("neither_target", "leukoplakia", "erythroplakia"),
        "preprocessing": "resnet50",
    },
    "caries_intraoral": {
        "filename": "caries_intraoral/model.keras",  # AlphaDent checkpoint
        "modality": "oral_photo",
        "classes": ("no_caries", "caries"),
        "preprocessing": "efficientnetb0",
    },
    "caries_xray": {
        "filename": "caries_xray/model.keras",  # DENTEX checkpoint
        "modality": "xray",
        "classes": ("no_caries", "caries"),
        "preprocessing": "efficientnetb0",
    },
}

models: dict[str, Any] = {}
versions: dict[str, str] = {}
load_errors: dict[str, str] = {}


def _checkpoint_version(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"pp1-dev-{digest.hexdigest()[:12]}"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    for key, spec in MODEL_SPECS.items():
        path = MODEL_DIR / spec["filename"]
        if not path.is_file():
            load_errors[key] = "checkpoint_missing"
            continue
        try:
            model = tf.keras.models.load_model(path, compile=False)
            if tuple(model.input_shape[1:]) != (224, 224, 3):
                raise ValueError(f"Unexpected input shape: {model.input_shape}")
            expected_outputs = 3 if key == "elp" else 1
            if model.output_shape[-1] != expected_outputs:
                raise ValueError(f"Unexpected output shape: {model.output_shape}")
            models[key] = model
            versions[key] = _checkpoint_version(path)
            LOG.info("Loaded %s (%s)", key, versions[key])
        except Exception as exc:
            load_errors[key] = f"load_failed: {type(exc).__name__}"
            LOG.exception("Could not load %s from %s", key, path)
    yield
    models.clear()
    versions.clear()
    load_errors.clear()


app = FastAPI(title="J26-SE-307 ML service", version="0.2.0", lifespan=lifespan)


def preprocess_image(file_bytes: bytes, model_key: str) -> np.ndarray:
    """Exactly match the validation pipelines in LPEP.ipynb and Caries.ipynb."""
    image = tf.io.decode_image(file_bytes, channels=3, expand_animations=False)
    image.set_shape([None, None, 3])
    image = tf.cast(image, tf.float32)
    if model_key == "elp":
        image = tf.image.resize_with_pad(image, 224, 224)
        image = tf.keras.applications.resnet50.preprocess_input(image)
    else:
        # EfficientNetB0 in Caries.ipynb includes input rescaling internally.
        image = tf.image.resize(image, (224, 224))
    return tf.expand_dims(image, axis=0).numpy()


def decode_scores(model_key: str, prediction: Any) -> dict[str, float]:
    values = np.asarray(prediction, dtype=np.float64).reshape(-1)
    if model_key == "elp":
        if values.size != 3 or not np.all(np.isfinite(values)):
            raise ValueError("Invalid ELP output shape or values")
        if np.any(values < 0) or np.any(values > 1) or not np.isclose(values.sum(), 1, atol=0.01):
            raise ValueError("ELP checkpoint must output three softmax scores")
        return dict(zip(MODEL_SPECS[model_key]["classes"], map(float, values)))
    if values.size != 1 or not np.isfinite(values[0]) or not 0 <= values[0] <= 1:
        raise ValueError("Caries checkpoint must output one sigmoid score")
    caries_score = float(values[0])
    return {"no_caries": 1.0 - caries_score, "caries": caries_score}


@app.get("/health")
def health():
    return {
        "ok": True,
        "models": {
            key: {"status": "loaded" if key in models else "unavailable",
                  "version": versions.get(key), "reason": load_errors.get(key)}
            for key in MODEL_SPECS
        },
    }


@app.post("/predict/{model_key}")
def predict(
    model_key: str,
    image: UploadFile = File(...),
    clinical_data: str | None = Form(None),
):
    if model_key not in MODEL_SPECS:
        raise HTTPException(status_code=404, detail="Unknown model key")
    if model_key not in models:
        raise HTTPException(status_code=503, detail=f"{model_key} checkpoint unavailable")
    if image.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=400, detail="Upload a JPEG or PNG image")
    if clinical_data:
        try:
            clinical = json.loads(clinical_data)
            if not isinstance(clinical, dict):
                raise ValueError("Must be an object")
        except (ValueError, TypeError) as exc:
            raise HTTPException(status_code=400, detail="clinical_data must be a JSON object") from exc
        # Clinical data is accepted for the API contract; these image models do not use it.

    file_bytes = image.file.read(MAX_IMAGE_BYTES + 1)
    if not file_bytes or len(file_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be between 1 byte and 10 MB")
    try:
        tensor = preprocess_image(file_bytes, model_key)
    except (tf.errors.OpError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image") from exc

    try:
        scores = decode_scores(model_key, models[model_key].predict(tensor, verbose=0))
    except Exception as exc:
        LOG.exception("Inference failed for %s", model_key)
        raise HTTPException(status_code=500, detail="Model inference failed") from exc

    if model_key == "elp":
        predicted_class = max(scores, key=scores.get)
    else:
        # Provisional threshold: choose and freeze using validation data later.
        predicted_class = "caries" if scores["caries"] >= 0.5 else "no_caries"

    return {
        "modelKey": model_key,
        "modelVersion": versions[model_key],
        "status": "completed",
        "inputModality": MODEL_SPECS[model_key]["modality"],
        "predictedClass": predicted_class,
        "classScores": scores,
        "bbox": None,
        "qualityWarning": "Development checkpoint; clinical performance not finalized",
    }
