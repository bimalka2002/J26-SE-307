"""Model contracts and checkpoint lifecycle for the inference service."""

import hashlib
import logging
from pathlib import Path
from typing import Any

import tensorflow as tf

LOG = logging.getLogger(__name__)
MODEL_DIR = Path(__file__).resolve().parent / "saved_models"

# Keep names, output order, resizing, and preprocessing aligned with the
# corresponding validation notebook and checkpoint metadata.
MODEL_SPECS = {
    "olp": {
        "filename": "olp/model.keras",
        "modality": "oral_photo",
        "classes": ("negative", "positive"),
        "output": "sigmoid",
        "resize": "pad",
        "preprocess": "mobilenet_v2",
        "threshold": 0.5,
        "expected_outputs": 1,
    },
    "osmf": {
        "filename": "osmf/model.keras",
        "modality": "oral_photo",
        "classes": ("negative", "positive"),
        "output": "sigmoid",
        "resize": "pad",
        "preprocess": "none",
        "threshold": 0.5,
        "expected_outputs": 1,
    },
    "elp": {
        "filename": "leukoplakia_erythroplakia/model.keras",
        "modality": "oral_photo",
        "classes": ("neither_target", "leukoplakia", "erythroplakia"),
        "output": "softmax",
        "resize": "pad",
        "preprocess": "resnet50",
        "threshold": None,
        "expected_outputs": 3,
    },
    "caries_intraoral": {
        "filename": "caries_intraoral/model.keras",
        "modality": "oral_photo",
        "classes": ("no_caries", "caries"),
        "output": "sigmoid",
        "resize": "stretch",
        "preprocess": "none",
        "threshold": 0.5,
        "expected_outputs": 1,
    },
    "caries_xray": {
        "filename": "caries_xray/model.keras",
        "modality": "xray",
        "classes": ("no_caries", "caries"),
        "output": "sigmoid",
        "resize": "stretch",
        "preprocess": "none",
        "threshold": 0.5,
        "expected_outputs": 1,
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


def load_models() -> None:
    for key, spec in MODEL_SPECS.items():
        path = MODEL_DIR / spec["filename"]
        if not path.is_file():
            load_errors[key] = "checkpoint_missing"
            LOG.warning("Missing checkpoint for %s: %s", key, path)
            continue
        try:
            model = tf.keras.models.load_model(path, compile=False)
            if tuple(model.input_shape[1:]) != (224, 224, 3):
                raise ValueError(f"Unexpected input shape: {model.input_shape}")
            if model.output_shape[-1] != spec["expected_outputs"]:
                raise ValueError(f"Unexpected output shape: {model.output_shape}")
            version = _checkpoint_version(path)
            models[key] = model
            versions[key] = version
            load_errors.pop(key, None)
            LOG.info("Loaded %s (%s)", key, version)
        except Exception as exc:
            models.pop(key, None)
            versions.pop(key, None)
            load_errors[key] = f"load_failed: {type(exc).__name__}"
            LOG.exception("Could not load %s from %s", key, path)


def clear_models() -> None:
    models.clear()
    versions.clear()
    load_errors.clear()
