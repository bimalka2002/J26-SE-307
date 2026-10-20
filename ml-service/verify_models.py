"""Check that all five packaged checkpoints match their metadata and manifest."""

import hashlib
import json
from pathlib import Path


MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_FILES = {
    "olp": "olp/model.keras",
    "osmf": "osmf/model.keras",
    "leukoplakia_erythroplakia": "leukoplakia_erythroplakia/model.keras",
    "caries_intraoral": "caries_intraoral/model.keras",
    "caries_xray": "caries_xray/model.keras",
}


def verify_models() -> None:
    manifest = json.loads((MODEL_DIR / "manifest.json").read_text())
    if set(manifest["branches"]) != set(MODEL_FILES):
        raise ValueError("Manifest must list exactly the five packaged models")

    for key, filename in MODEL_FILES.items():
        metadata = json.loads((MODEL_DIR / key / "metadata.json").read_text())
        if metadata["branch"] != key or metadata["model_file"] != filename:
            raise ValueError(f"Wrong model metadata for {key}")
        if manifest["branches"][key] != metadata:
            raise ValueError(f"Manifest and metadata differ for {key}")

        path = MODEL_DIR / filename
        if path.stat().st_size != metadata["bytes"]:
            raise ValueError(f"Checkpoint size differs from metadata for {key}")
        with path.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        if digest != metadata["sha256"]:
            raise ValueError(f"Checkpoint hash differs from metadata for {key}")
        print(f"Verified {key}: {filename}", flush=True)


if __name__ == "__main__":
    verify_models()
