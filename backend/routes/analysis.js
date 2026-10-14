import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Analysis from "../models/Analysis.js";
import { requireAuth } from "../middleware/auth.js";
import { DEFAULT_REQUESTED_MODELS } from "../config/models.js";
import { runPipeline } from "../workers/pipeline.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads");

// Ensure upload dir exists before multer writes.
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

function parseClinicalData(raw) {
  if (raw == null || raw === "") return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// POST /analyses — oral photo for ELP (leukoplakia / erythroplakia)
router.post(
  "/",
  requireAuth,
  upload.fields([{ name: "oral_photo", maxCount: 1 }]),
  async (req, res) => {
    try {
      const oralPhoto = req.files?.oral_photo?.[0];
      if (!oralPhoto) {
        return res.status(400).json({ message: "oral_photo is required" });
      }

      const clinicalData = parseClinicalData(req.body.clinicalData);
      if (clinicalData === null) {
        return res.status(400).json({ message: "clinicalData must be valid JSON" });
      }

      // This route only queues ELP. Teammates will add their model keys later.
      const analysis = await Analysis.create({
        userId: req.user._id,
        inputs: [
          {
            modality: "oral_photo",
            storageKey: oralPhoto.path,
            originalFilename: oralPhoto.originalname,
            mimeType: oralPhoto.mimetype,
            sizeBytes: oralPhoto.size,
          },
        ],
        clinicalData,
        requestedModels: [...DEFAULT_REQUESTED_MODELS],
        status: "queued",
      });

      // Fire-and-forget — response returns while ELP inference runs.
      runPipeline(
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
      console.error("create analysis error:", err.message);
      return res.status(500).json({ message: "Failed to create analysis" });
    }
  }
);

// GET /analyses/:id — poll status / results (owner only)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    if (String(analysis.userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ analysis });
  } catch (err) {
    console.error("get analysis error:", err.message);
    return res.status(500).json({ message: "Failed to fetch analysis" });
  }
});

// Multer / upload validation errors → JSON 400
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message === "Only image uploads are allowed") {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

export default router;
