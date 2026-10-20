import analysisModel from "../models/analysisModel.js";
import fs from "node:fs/promises";
import { DEFAULT_REQUESTED_MODELS } from "../config/models.js";
import { runPipeline } from "../workers/pipeline.js";
import { removeSubmittedFiles } from "../middleware/upload.js";
import { uploadImage, removeImage, readImage } from "../services/imageStorage.js";

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
  const inputs = [];
  const imageBytes = new Map();
  let persisted = false;
  let stage = "validate request";
  try {
    const oralPhoto = req.files?.oral_photo?.[0];
    const xray = req.files?.xray?.[0];
    if (!oralPhoto && !xray) {
      return res.status(400).json({ message: "oral_photo or xray is required" });
    }

    const clinicalData = parseClinicalData(req.body.clinicalData);
    if (clinicalData === null) {
      return res.status(400).json({ message: "clinicalData must be a JSON object" });
    }

    const submissions = [
      oralPhoto && { modality: "oral_photo", file: oralPhoto },
      xray && { modality: "xray", file: xray },
    ].filter(Boolean);
    // Track each success so a later upload or database failure can be rolled back.
    for (const { modality, file } of submissions) {
      // The temporary upload is already on this server. Keep its bytes for the
      // in-process pipeline instead of downloading it back from Cloudinary.
      stage = `read ${modality} upload`;
      const bytes = await fs.readFile(file.path);
      stage = `store ${modality} image`;
      inputs.push({ modality, ...await uploadImage(file) });
      imageBytes.set(modality, bytes);
    }
    await removeSubmittedFiles(req);

    // ELP-only by default; teammates extend requestedModels later.
    stage = "create analysis record";
    const analysis = await analysisModel.create({
      userId: req.user._id,
      inputs,
      clinicalData,
      requestedModels: [...DEFAULT_REQUESTED_MODELS],
      status: "queued",
    });
    persisted = true;

    // In-process worker for now; swap for a durable queue later.
    void runPipeline(
      analysis._id,
      analysis.inputs,
      analysis.clinicalData,
      analysis.requestedModels,
      imageBytes
    );

    return res.status(202).json({
      analysisId: analysis._id,
      status: analysis.status,
      requestedModels: analysis.requestedModels,
    });
  } catch (err) {
    if (!persisted) {
      const cleanup = await Promise.allSettled(inputs.map(removeImage));
      cleanup.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("Cloudinary rollback failed for:", inputs[index].storageKey);
        }
      });
    }
    const details = err instanceof Error ? err.message :
      (err && typeof err === "object" ? err.message || err.error?.message || err.error : String(err));
    console.error(`create analysis error (${stage}):`, details || "Unknown error",
      err?.http_code ? `(HTTP ${err.http_code})` : "");
    if (err?.code === "IMAGE_STORAGE_UNAVAILABLE") {
      return res.status(503).json({ message: "Image storage is not configured" });
    }
    if (stage.startsWith("store ")) {
      return res.status(502).json({ message: "Image storage failed. Please try again or contact support." });
    }
    return res.status(500).json({ message: "Failed to create analysis" });
  } finally {
    await removeSubmittedFiles(req);
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

// Return recent screenings belonging to the signed-in user for mobile history.
export async function listAnalyses(req, res) {
  try {
    const analyses = await analysisModel
      .find({ userId: req.user._id })
      .sort({ createdAt: -1, _id: -1 })
      .limit(50)
      .select("status createdAt updatedAt inputs.modality modelResults.modelKey modelResults.status modelResults.predictedClass")
      .lean();
    return res.json({ analyses });
  } catch (err) {
    console.error("list analyses error:", err.message);
    return res.status(500).json({ message: "Failed to load screening history" });
  }
}

// Streams one uploaded image back to its owner so the results page can show what was analysed.
export async function getAnalysisImage(req, res) {
  try {
    const { modality } = req.params;
    if (!["oral_photo", "xray"].includes(modality)) {
      return res.status(404).json({ message: "Image not found" });
    }

    const analysis = await analysisModel.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    if (String(analysis.userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const input = analysis.inputs.find((item) => item.modality === modality);
    if (!input) {
      return res.status(404).json({ message: "Image not found" });
    }

    const bytes = await readImage(input);
    res.set({
      "Content-Type": input.mimeType || "application/octet-stream",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
    return res.send(bytes);
  } catch (err) {
    console.error("get analysis image error:", err.message);
    return res.status(500).json({ message: "Failed to load image" });
  }
}
