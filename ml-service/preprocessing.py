"""Match each checkpoint's validation image pipeline."""

import numpy as np
import tensorflow as tf

from model_registry import MODEL_SPECS


def preprocess_image(file_bytes: bytes, model_key: str) -> np.ndarray:
    spec = MODEL_SPECS[model_key]
    try:
        image = tf.io.decode_image(file_bytes, channels=3, expand_animations=False)
        image.set_shape([None, None, 3])
        image = tf.cast(image, tf.float32)

        if spec["resize"] == "pad":
            image = tf.image.resize_with_pad(image, 224, 224)
        elif spec["resize"] == "stretch":
            image = tf.image.resize(image, (224, 224))
        else:
            raise ValueError(f"Unknown resize setting: {spec['resize']}")

        if spec["preprocess"] == "mobilenet_v2":
            image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
        elif spec["preprocess"] == "resnet50":
            image = tf.keras.applications.resnet50.preprocess_input(image)
        elif spec["preprocess"] != "none":
            raise ValueError(f"Unknown preprocessing: {spec['preprocess']}")
        # EfficientNet checkpoints rescale internally; retain float32 [0, 255].
        return tf.expand_dims(image, axis=0).numpy()
    except (tf.errors.OpError, ValueError) as exc:
        raise ValueError("Invalid or unsupported image") from exc
