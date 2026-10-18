import { v2 as cloudinary } from "cloudinary";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

export function installMockCloudinary() {
  const credentials = {
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-key",
    CLOUDINARY_API_SECRET: "test-secret",
  };
  const previousEnv = Object.fromEntries(Object.keys(credentials).map((key) => [key, process.env[key]]));
  Object.assign(process.env, credentials);
  const previousUpload = cloudinary.uploader.upload;
  const previousDestroy = cloudinary.uploader.destroy;
  const previousFetch = globalThis.fetch;
  const assets = new Map();
  const uploads = [];
  const downloads = [];
  const destroyed = [];

  cloudinary.uploader.upload = async (path, options) => {
    assert.equal(options.type, "authenticated");
    assert.equal(options.overwrite, false);
    const bytes = await readFile(path);
    const publicId = `${options.folder}/${options.public_id}`;
    uploads.push({ path, options, publicId });
    assets.set(publicId, bytes);
    return { public_id: publicId, format: path.endsWith(".png") ? "png" : "jpg", bytes: bytes.length };
  };
  cloudinary.uploader.destroy = async (publicId, options) => {
    assert.equal(options.type, "authenticated");
    destroyed.push(publicId);
    assets.delete(publicId);
    return { result: "ok" };
  };
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    if (parsed.hostname === "api.cloudinary.com") {
      assert.equal(parsed.searchParams.get("type"), "authenticated");
      assert.ok(parsed.searchParams.get("signature"));
      const expires = Number(parsed.searchParams.get("expires_at"));
      assert.ok(expires > Date.now() / 1000 && expires <= Date.now() / 1000 + 300);
      downloads.push(parsed);
      const bytes = assets.get(parsed.searchParams.get("public_id"));
      return new Response(bytes || "Missing image", { status: bytes ? 200 : 404 });
    }
    // Verify the actual bytes forwarded to FastAPI, not just the result status.
    const image = options?.body?.get("image");
    if (image) {
      const bytes = Buffer.from(await image.arrayBuffer());
      assert.ok([...assets.values()].some((asset) => asset.equals(bytes)));
    }
    return previousFetch(url, options);
  };

  return {
    assets, uploads, downloads, destroyed,
    restore() {
      cloudinary.uploader.upload = previousUpload;
      cloudinary.uploader.destroy = previousDestroy;
      globalThis.fetch = previousFetch;
      for (const [key, value] of Object.entries(previousEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    },
  };
}
