import analysisModel from "../models/analysisModel.js";
import { DEFAULT_REQUESTED_MODELS } from "../config/models.js";
import { runPipeline } from "../workers/pipeline.js";
import { removeSubmittedFiles } from "../middleware/upload.js";

function parseClinicalData(raw) {
  if (raw == null || raw === "") return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function createAnalysis(req, res) {
  try {
    const oralPhoto = req.files?.oral_photo?.[0];
    const xray = req.files?.xray?.[0];
    if (!oralPhoto && !xray) {
      removeSubmittedFiles(req);
      return res.status(400).json({ message: "oral_photo or xray is required" });
    }

    const clinicalData = parseClinicalData(req.body.clinicalData);
    if (clinicalData === null) {
      removeSubmittedFiles(req);
      return res.status(400).json({ message: "clinicalData must be a JSON object" });
    }

    const inputs = [
      oralPhoto && { modality: "oral_photo", file: oralPhoto },
      xray && { modality: "xray", file: xray },
    ]
      .filter(Boolean)
      .map(({ modality, file }) => ({
        modality,
        storageKey: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }));

    // ELP-only by default; teammates extend requestedModels later.
    const analysis = await analysisModel.create({
      userId: req.user._id,
      inputs,
      clinicalData,
      requestedModels: [...DEFAULT_REQUESTED_MODELS],
      status: "queued",
    });

    // In-process worker for now; swap for a durable queue later.
    void runPipeline(
      analysis._id,
      analysis.inputs,
      analysis.clinicalData,
      analysis.requestedModels
    );

    return res.status(202).json({
      analysisId: analysis._id,
      status: analysis.status,
      requestedModels: analysis.requestedModels,
    });
  } catch (err) {
    removeSubmittedFiles(req);
    console.error("create analysis error:", err);
    return res.status(500).json({ message: "Failed to create analysis" });
  }
}

export async function getAnalysis(req, res) {
  try {
    const analysis = await analysisModel.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    if (String(analysis.userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ analysis });
  } catch (err) {
    console.error("get analysis error:", err);
    return res.status(500).json({ message: "Failed to fetch analysis" });
  }
}
