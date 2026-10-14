// Disease model registry for the multimodal pipeline.
// Pramod owns ELP: one trained model covers oral leukoplakia + erythroplakia.
// Teammates add their own keys the same way (olp, osmf, caries).

export const MODEL_KEYS = {
  ELP: "elp",
};

// Which image modality each model needs.
export const MODEL_ROUTING = {
  [MODEL_KEYS.ELP]: "oral_photo",
};

// Default run for this component — only ELP until other adapters are wired.
export const DEFAULT_REQUESTED_MODELS = [MODEL_KEYS.ELP];

// Labels the ELP head is expected to emit (align with trained checkpoint).
export const ELP_CLASS_NAMES = ["neither", "leukoplakia", "erythroplakia"];
