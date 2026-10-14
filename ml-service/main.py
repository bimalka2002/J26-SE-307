"""
ELP inference service — oral leukoplakia + erythroplakia (single 3-class model).

Teammates can add /predict/olp, /predict/osmf, /predict/caries beside this.
Until a trained checkpoint is placed under saved_models/, /predict/elp runs in stub mode.
"""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image

APP_DIR = Path(__file__).resolve().parent
ELP_MODEL_PATH = APP_DIR / "saved_models" / "elp.keras"

# Keep in sync with backend/config/models.js → ELP_CLASS_NAMES
ELP_CLASS_NAMES = ["neither", "leukoplakia", "erythroplakia"]
MODEL_VERSION = "1.0.0-stub"

app = FastAPI(title="J26-SE-307 ML service", version="0.1.0")

# Loaded only if tensorflow + checkpoint are available.
_elp_model = None


def _try_load_elp_model():
    global _elp_model, MODEL_VERSION
    if not ELP_MODEL_PATH.exists():
        print(f"No checkpoint at {ELP_MODEL_PATH} — ELP stub mode")
        return
    try:
        import tensorflow as tf  # optional dependency

        _elp_model = tf.keras.models.load_model(ELP_MODEL_PATH)
        MODEL_VERSION = "1.0.0"
        print(f"Loaded ELP model from {ELP_MODEL_PATH}")
    except Exception as exc:  # noqa: BLE001 — startup should not crash without TF
        print(f"ELP model load failed ({exc}) — stub mode")
        _elp_model = None


@app.on_event("startup")
def startup():
    _try_load_elp_model()


def preprocess_image(file_bytes: bytes, target_size=(224, 224)) -> np.ndarray:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = img.resize(target_size)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


def stub_scores(file_bytes: bytes) -> dict[str, float]:
    """
    Deterministic placeholder scores so the Node pipeline can be tested end-to-end.
    Replace by real softmax output once elp.keras is in place.
    """
    seed = int(hashlib.md5(file_bytes[:4096]).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)
    raw = rng.random(len(ELP_CLASS_NAMES))
    raw = raw / raw.sum()
    return {name: float(score) for name, score in zip(ELP_CLASS_NAMES, raw)}


def real_scores(tensor: np.ndarray) -> dict[str, float]:
    preds = _elp_model.predict(tensor, verbose=0)[0]
    preds = np.asarray(preds, dtype=np.float64).reshape(-1)
    if preds.size != len(ELP_CLASS_NAMES):
        raise HTTPException(
            status_code=500,
            detail=(
                f"Model output size {preds.size} != "
                f"expected {len(ELP_CLASS_NAMES)} classes"
            ),
        )
    return {name: float(score) for name, score in zip(ELP_CLASS_NAMES, preds)}


@app.get("/health")
def health():
    return {
        "ok": True,
        "elp": "loaded" if _elp_model is not None else "stub",
        "modelVersion": MODEL_VERSION,
    }


@app.post("/predict/{model_key}")
async def predict(
    model_key: str,
    image: UploadFile = File(...),
    clinical_data: str | None = Form(None),
):
    # This service currently owns ELP only.
    if model_key != "elp":
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_key}' is not served here (ELP only)",
        )

    clinical: dict[str, Any] = {}
    if clinical_data:
        try:
            clinical = json.loads(clinical_data)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="clinical_data must be JSON") from exc

    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    try:
        tensor = preprocess_image(file_bytes)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc

    if _elp_model is not None:
        class_scores = real_scores(tensor)
        version = MODEL_VERSION
    else:
        class_scores = stub_scores(file_bytes)
        version = MODEL_VERSION

    predicted_class = max(class_scores, key=class_scores.get)

    # clinical is accepted for future fusion; unused by the image head today.
    _ = clinical

    return {
        "modelKey": "elp",
        "modelVersion": version,
        "status": "completed",
        "inputModality": "oral_photo",
        "predictedClass": predicted_class,
        "classScores": class_scores,
        "bbox": None,
        "qualityWarning": None,
    }
