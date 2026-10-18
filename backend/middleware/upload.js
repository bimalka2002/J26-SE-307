import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadRoot, { recursive: true });

export const upload = multer({
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

export function submittedFiles(req) {
  return Object.values(req.files || {}).flat();
}

export async function removeSubmittedFiles(req) {
  await Promise.all(submittedFiles(req).map(async (file) => {
    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      if (error.code !== "ENOENT") console.error("Temporary upload cleanup failed:", error.message);
    }
  }));
}

export async function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError || err.message === "Only JPEG and PNG images are allowed") {
    await removeSubmittedFiles(req);
    return res.status(400).json({ message: err.message });
  }
  return next(err);
}
