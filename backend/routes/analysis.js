import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "url";
import Analysis from "../models/Analysis.js";
import { requireAuth } from "../middleware/auth.js";
import { DEFAULT_REQUESTED_MODELS } from "../config/models.js";
import { runPipeline } from "../workers/pipeline.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads");

// Ensure upload dir exists before multer writ
fs.mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => {
      const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return cb(new Error("Only JPEG and PNG images are allowed"));
    }
    cb(null, true);
  },
});

function parseClinicalData(raw) {
  if (raw == null || raw === "") return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function submittedFiles(req) {
  return Object.values(req.files || {}).flat();
}

function removeSubmittedFiles(req) {
  for (const file of submittedFiles(req)) {
    fs.promises.unlink(file.path).catch(() => {});
  }
}

// POST /analyses: one oral photo, one dental X-ray, or both.
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "oral_photo", maxCount: 1 },
    { name: "xray", maxCount: 1 },
  ]),
  async (req, res) => {
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
      ].filter(Boolean).map(({ modality, file }) => ({
        modality,
        storageKey: file.path,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }));

      const analysis = await Analysis.create({
        userId: req.user._id,
        inputs,
        clinicalData,
        requestedModels: [...DEFAULT_REQUESTED_MODELS],
        status: "queued",
      });
      // PP1's current in-process worker; replace with a durable queue in PP2.
      void runPipeline(analysis._id, analysis.inputs, analysis.clinicalData, analysis.requestedModels);
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
);

// GET /analyses/:id — poll status / results (owner only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    if (String(analysis.userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    return res.json({ analysis });
  } catch (err) {
    console.error("get analysis error:", err);
    return res.status(500).json({ message: "Failed to fetch analysis" });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only JPEG and PNG images are allowed") {
    removeSubmittedFiles(req);
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

export default router;
