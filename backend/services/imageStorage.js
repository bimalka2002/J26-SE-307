import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";

function client() {
  // Read lazily: index.js loads dotenv after importing the routes.
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  };
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    const error = new Error("Image storage is not configured");
    error.code = "IMAGE_STORAGE_UNAVAILABLE";
    throw error;
  }
  cloudinary.config(config);
  return cloudinary;
}

export async function uploadImage(file) {
  const result = await client().uploader.upload(file.path, {
    resource_type: "image",
    type: "authenticated",
    folder: process.env.CLOUDINARY_FOLDER || "oralscan/analyses",
    public_id: randomUUID(),
    overwrite: false,
    allowed_formats: ["jpg", "png"],
    timeout: 30_000,
  });
  return {
    storageProvider: "cloudinary",
    storageKey: result.public_id,
    format: result.format,
    originalFilename: file.originalname,
    mimeType: result.format === "png" ? "image/png" : "image/jpeg",
    sizeBytes: result.bytes,
  };
}

export async function removeImage(input) {
  return client().uploader.destroy(input.storageKey, {
    resource_type: "image",
    type: "authenticated",
    invalidate: true,
    timeout: 30_000,
  });
}

export async function readImage(input) {
  // Analyses created before Cloudinary was enabled retain their local paths.
  if (!input.storageProvider || input.storageProvider === "local") {
    return fs.readFile(input.storageKey);
  }
  if (input.storageProvider !== "cloudinary") {
    throw new Error("Unsupported image storage provider");
  }
  const url = client().utils.private_download_url(input.storageKey, input.format, {
    resource_type: "image",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 300,
    attachment: false,
  });
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}
