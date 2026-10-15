import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload, handleUploadError } from "../middleware/upload.js";
import { createAnalysis, getAnalysis } from "../controllers/analysisController.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "oral_photo", maxCount: 1 },
    { name: "xray", maxCount: 1 },
  ]),
  createAnalysis
);

router.get("/:id", requireAuth, getAnalysis);

router.use(handleUploadError);

export default router;
