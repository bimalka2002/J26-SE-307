import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readImage, uploadImage, removeImage } from "../services/imageStorage.js";
import { installMockCloudinary } from "./helpers/cloudinary.js";
import { ensureFixtures, fixturePath, TINY_PNG } from "./helpers/fixtures.js";

let storage;
beforeEach(async () => {
  await ensureFixtures();
  storage = installMockCloudinary();
});
afterEach(() => storage.restore());

test("authenticated Cloudinary upload can be downloaded and removed", async () => {
  const input = await uploadImage({ path: fixturePath("oral.png"), originalname: "oral.png" });
  assert.equal(input.storageProvider, "cloudinary");
  assert.equal(input.sizeBytes, TINY_PNG.length);
  assert.deepEqual(await readImage(input), TINY_PNG);
  await removeImage(input);
  await assert.rejects(readImage(input), /Image download failed \(404\)/);
});

test("legacy local images remain readable", async () => {
  assert.deepEqual(await readImage({ storageKey: fixturePath("oral.png") }), TINY_PNG);
});

test("missing configuration does not silently fall back to local storage", async () => {
  delete process.env.CLOUDINARY_API_KEY;
  await assert.rejects(uploadImage({ path: fixturePath("oral.png") }), {
    code: "IMAGE_STORAGE_UNAVAILABLE",
  });
});
