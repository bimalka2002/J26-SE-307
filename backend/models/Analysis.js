import mongoose from "mongoose";

// One uploaded image (or x-ray) belonging to an analysis.
const inputSchema = new mongoose.Schema(
  {
    modality: {
      type: String,
      enum: ["oral_photo", "xray"],
      required: true,
    },
    // Object key / path in private storage — not a public URL.
    storageKey: {
      type: String,
      required: true,
    },
    originalFilename: String,
    mimeType: String,
    sizeBytes: Number,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Shared envelope returned by FastAPI model adapters.
const modelResultSchema = new mongoose.Schema(
  {
    modelKey: {
      type: String,
      required: true, // e.g. "osmf"
    },
    modelVersion: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "failed", "skipped"],
      required: true,
    },
    inputModality: {
      type: String,
      enum: ["oral_photo", "xray"],
      required: true,
    },
    predictedClass: {
      type: String,
      default: null,
    },
    // Flexible score map so adapters can expose different class sets.
    classScores: {
      type: Map,
      of: Number,
      default: undefined,
    },
    bbox: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    qualityWarning: {
      type: String,
      default: null,
    },
    error: {
      code: String,
      message: String,
    },
    completedAt: Date,
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: null,
    },
    llmModel: {
      type: String,
      default: null,
    },
    // Bump this when the prompt template changes.
    promptVersion: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    inputs: {
      type: [inputSchema],
      default: [],
    },
    // Pipeline lifecycle. Job payload itself stays in Redis.
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "partial_fail"],
      default: "queued",
      index: true,
    },
    // Which adapters the worker should call for this run.
    requestedModels: {
      type: [String],
      default: [],
    },
    error: {
      code: String,
      message: String,
    },
    modelResults: {
      type: [modelResultSchema],
      default: [],
    },
    report: {
      type: reportSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

analysisSchema.index({ userId: 1, createdAt: -1 });

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
