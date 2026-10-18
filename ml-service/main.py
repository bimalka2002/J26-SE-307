"""FastAPI endpoints for OLP, OSMF, ELP, and two caries checkpoints."""

import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from model_registry import MODEL_SPECS, clear_models, load_errors, load_models, models, versions
from prediction import decode_scores, pick_class
from preprocessing import preprocess_image

LOG = logging.getLogger(__name__)
MAX_IMAGE_BYTES = 10 * 1024 * 1024


@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_models()
    try:
        yield
    finally:
        clear_models()


app = FastAPI(title="J26-SE-307 ML service", version="0.3.0", lifespan=lifespan)


@app.get("/health")
def health():
    return {
        "ok": True,
        "models": {
            key: {
                "status": "loaded" if key in models else "unavailable",
                "version": versions.get(key),
                "reason": load_errors.get(key),
                "modality": spec["modality"],
            }
            for key, spec in MODEL_SPECS.items()
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
        # Clinical data is accepted for the API contract but not used by these checkpoints.

    file_bytes = image.file.read(MAX_IMAGE_BYTES + 1)
    if not file_bytes or len(file_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be between 1 byte and 10 MB")
    try:
        tensor = preprocess_image(file_bytes, model_key)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid or unsupported image") from exc

    try:
        raw = models[model_key].predict(tensor, verbose=0)
        scores = decode_scores(model_key, raw)
    except Exception as exc:
        LOG.exception("Inference failed for %s", model_key)
        raise HTTPException(status_code=500, detail="Model inference failed") from exc

    return {
        "modelKey": model_key,
        "modelVersion": versions[model_key],
        "status": "completed",
        "inputModality": MODEL_SPECS[model_key]["modality"],
        "predictedClass": pick_class(model_key, scores),
        "classScores": scores,
        "bbox": None,
        "qualityWarning": "Development checkpoint; clinical performance not finalized",
    }
