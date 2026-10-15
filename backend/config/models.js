// Disease model registry for the multimodal pipeline.
// OLP / ELP / caries are wired here. OSMF is owned by another teammate.

export const MODEL_KEYS = {
  OLP: "olp",
  ELP: "elp",
  CARIES_INTRAORAL: "caries_intraoral",
  CARIES_XRAY: "caries_xray",
};

// Which image modality each model needs.
export const MODEL_ROUTING = {
  [MODEL_KEYS.OLP]: "oral_photo",
  [MODEL_KEYS.ELP]: "oral_photo",
  [MODEL_KEYS.CARIES_INTRAORAL]: "oral_photo",
  [MODEL_KEYS.CARIES_XRAY]: "xray",
};

// Models the analysis pipeline requests by default.
export const DEFAULT_REQUESTED_MODELS = [
  MODEL_KEYS.OLP,
  MODEL_KEYS.ELP,
  MODEL_KEYS.CARIES_INTRAORAL,
  MODEL_KEYS.CARIES_XRAY,
];

// Class labels aligned with trained checkpoints (docs / validation helpers).
export const OLP_CLASS_NAMES = ["negative", "positive"];
export const ELP_CLASS_NAMES = ["neither_target", "leukoplakia", "erythroplakia"];
