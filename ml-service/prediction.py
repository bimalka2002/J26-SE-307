"""Validate model output and turn it into named scores and a class."""

from typing import Any

import numpy as np

from model_registry import MODEL_SPECS


def decode_scores(model_key: str, prediction: Any) -> dict[str, float]:
    spec = MODEL_SPECS[model_key]
    values = np.asarray(prediction, dtype=np.float64).reshape(-1)

    if spec["output"] == "softmax":
        if (
            values.size != len(spec["classes"])
            or not np.all(np.isfinite(values))
            or np.any(values < 0)
            or np.any(values > 1)
            or not np.isclose(values.sum(), 1, atol=0.01)
        ):
            raise ValueError("Invalid softmax output")
        return dict(zip(spec["classes"], map(float, values)))

    if spec["output"] != "sigmoid":
        raise ValueError(f"Unknown output type: {spec['output']}")
    if len(spec["classes"]) != 2 or values.size != 1 or not np.isfinite(values[0]):
        raise ValueError("Invalid sigmoid output")
    if not 0 <= values[0] <= 1:
        raise ValueError("Sigmoid score must be in [0, 1]")
    positive = float(values[0])
    negative_name, positive_name = spec["classes"]
    return {negative_name: 1.0 - positive, positive_name: positive}


def pick_class(model_key: str, scores: dict[str, float]) -> str:
    spec = MODEL_SPECS[model_key]
    if spec["output"] == "softmax":
        return max(scores, key=scores.get)
    _, positive_name = spec["classes"]
    return positive_name if scores[positive_name] >= spec["threshold"] else spec["classes"][0]
