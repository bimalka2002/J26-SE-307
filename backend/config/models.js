// Disease model registry for the multimodal pipeline.
// Pramod owns ELP: one trained model covers oral leukoplakia + erythroplakia.
// Teammates add their own keys the same way (olp, osmf, caries).

export const MODEL_KEYS = {
  ELP: "elp",
  CARIES_INTRAORAL: "caries_intraoral",
  CARIES_XRAY: "caries_xray",
};

// Which image modality each model needs.
export const MODEL_ROUTING = {
  [MODEL_KEYS.ELP]: "oral_photo",
  [MODEL_KEYS.CARIES_INTRAORAL]: "oral_photo",
  [MODEL_KEYS.CARIES_XRAY]: "xray",
};

// Default run for this component — only ELP until other adapters are wired.
export const DEFAULT_REQUESTED_MODELS = [
  MODEL_KEYS.ELP,
  MODEL_KEYS.CARIES_INTRAORAL,
  MODEL_KEYS.CARIES_XRAY,
];

// Labels the ELP head is expected to emit (align with trained checkpoint).
export const ELP_CLASS_NAMES = ["neither", "leukoplakia", "erythroplakia"];
