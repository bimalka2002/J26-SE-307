import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { installMockCloudinary } from "./helpers/cloudinary.js";
import express from "express";
import request from "supertest";
import authRoutes from "../routes/authRoutes.js";
import analysisRoutes from "../routes/analysisRoutes.js";
import User from "../models/userModel.js";
import analysisModel from "../models/analysisModel.js";
import { runPipeline } from "../workers/pipeline.js";
import { DEFAULT_REQUESTED_MODELS, MODEL_ROUTING } from "../config/models.js";
import { startMongo } from "./helpers/mongo.js";
import {
  ensureFixtures,
  fixturePath,
  installMockMl,
  resultMap,
  waitForTerminal,
} from "./helpers/fixtures.js";

process.env.JWT_SECRET = "isolated-analysis-test-secret-never-for-production";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/analyses", analysisRoutes);

const signup = {
  name: "Analysis Tester",
  email: "analysis@example.com",
  password: "valid-password-42",
};

let stop;
let restoreFetch;
let token;
let userId;
let storage;

before(async () => {
  stop = await startMongo();
  await User.init();
  await analysisModel.init();
  await ensureFixtures();
});

after(async () => {
  storage?.restore();
  if (restoreFetch) restoreFetch();
  if (stop) await stop();
});

beforeEach(async () => {
  storage?.restore();
  if (restoreFetch) restoreFetch();
  restoreFetch = installMockMl();
  storage = installMockCloudinary();
  await User.deleteMany({});
  await analysisModel.deleteMany({});

  const registration = await request(app).post("/auth/register").send(signup).expect(201);
  token = registration.body.token;
  userId = registration.body.user.id;
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

function createAnalysis(fields = {}) {
  let req = auth(request(app).post("/analyses"));
  if (fields.oral) req = req.attach("oral_photo", fixturePath(fields.oral));
  if (fields.xray) req = req.attach("xray", fixturePath(fields.xray));
  if (fields.clinicalData !== undefined) {
    req = req.field(
      "clinicalData",
      typeof fields.clinicalData === "string"
        ? fields.clinicalData
        : JSON.stringify(fields.clinicalData)
    );
  }
  return req;
}

async function fetchAnalysis(id) {
  const res = await auth(request(app).get(`/analyses/${id}`)).expect(200);
  return res.body.analysis;
}

test("rejects unauthenticated create and get", async () => {
  await request(app).post("/analyses").expect(401);
  await request(app).get("/analyses").expect(401);
  await request(app).get("/analyses/507f1f77bcf86cd799439011").expect(401);
});

test("history lists only the signed-in user's analyses, newest first", async () => {
  const other = await request(app).post("/auth/register").send({
    name: "Other User", email: "other@example.com", password: "valid-password-42",
  }).expect(201);
  const first = await analysisModel.create({ userId, status: "completed", createdAt: new Date("2026-01-01") });
  const second = await analysisModel.create({ userId, status: "queued", createdAt: new Date("2026-01-02") });
  await analysisModel.create({ userId: other.body.user.id, status: "failed", createdAt: new Date("2026-01-03") });

  const response = await auth(request(app).get("/analyses")).expect(200);
  assert.deepEqual(response.body.analyses.map((item) => item._id), [String(second._id), String(first._id)]);
  assert.ok(response.body.analyses.every((item) => !item.userId && !item.clinicalData));
});

test("rejects create with no images", async () => {
  const res = await createAnalysis().expect(400);
  assert.match(res.body.message, /oral_photo or xray/i);
});

test("rejects non-image uploads", async () => {
  const res = await auth(request(app).post("/analyses"))
    .attach("oral_photo", Buffer.from("not-an-image"), {
      filename: "notes.txt",
      contentType: "text/plain",
    })
    .expect(400);
  assert.match(res.body.message, /jpeg|png/i);
});

test("rejects invalid clinicalData JSON", async () => {
  const res = await createAnalysis({ oral: "oral.png", clinicalData: "{not-json" }).expect(400);
  assert.match(res.body.message, /clinicalData/i);

  const arrayRes = await createAnalysis({
    oral: "oral.png",
    clinicalData: JSON.stringify([1, 2]),
  }).expect(400);
  assert.match(arrayRes.body.message, /clinicalData/i);
});

test("oral_photo only: queues analysis, runs photo models, skips xray model", async () => {
  const created = await createAnalysis({
    oral: "oral.png",
    clinicalData: { age: 45, smoking: "never" },
  }).expect(202);

  assert.ok(created.body.analysisId);
  assert.equal(created.body.status, "queued");
  assert.deepEqual(created.body.requestedModels, DEFAULT_REQUESTED_MODELS);

  const analysis = await waitForTerminal(() => fetchAnalysis(created.body.analysisId));
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "completed");
  assert.equal(String(analysis.userId), userId);
  assert.deepEqual(analysis.clinicalData, { age: 45, smoking: "never" });
  assert.equal(analysis.inputs.length, 1);
  assert.equal(analysis.inputs[0].modality, "oral_photo");
  assert.equal(analysis.inputs[0].mimeType, "image/png");
  assert.equal(analysis.inputs[0].storageProvider, "cloudinary");
  assert.equal(analysis.inputs[0].storageKey, storage.uploads[0].publicId);
  assert.equal(analysis.inputs[0].format, "png");
  assert.equal(storage.downloads.length, 0);
  await assert.rejects(access(storage.uploads[0].path), { code: "ENOENT" });

  for (const [modelKey, modality] of Object.entries(MODEL_ROUTING)) {
    if (modality === "oral_photo") {
      assert.equal(byKey[modelKey].status, "completed");
    } else {
      assert.equal(byKey[modelKey].status, "skipped");
    }
  }
});

test("xray only: queues analysis, runs caries_xray, skips oral_photo models", async () => {
  const created = await createAnalysis({ xray: "xray.png" }).expect(202);
  const analysis = await waitForTerminal(() => fetchAnalysis(created.body.analysisId));
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "completed");
  assert.equal(analysis.inputs.length, 1);
  assert.equal(analysis.inputs[0].modality, "xray");
  assert.equal(analysis.inputs[0].mimeType, "image/png");
  assert.equal(storage.downloads.length, 0);

  for (const [modelKey, modality] of Object.entries(MODEL_ROUTING)) {
    assert.equal(byKey[modelKey].status, modality === "xray" ? "completed" : "skipped");
  }
});

test("oral_photo + xray (jpeg): all requested models complete with scores", async () => {
  const created = await createAnalysis({
    oral: "oral.png",
    xray: "xray.jpg",
    clinicalData: { symptoms: ["white patch"] },
  }).expect(202);

  const analysis = await waitForTerminal(() => fetchAnalysis(created.body.analysisId));
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "completed");
  assert.equal(analysis.inputs.length, 2);
  assert.deepEqual(
    analysis.inputs.map((i) => i.modality).sort(),
    ["oral_photo", "xray"]
  );
  assert.equal(storage.downloads.length, 0);

  for (const modelKey of DEFAULT_REQUESTED_MODELS) {
    assert.equal(byKey[modelKey].status, "completed");
    assert.ok(byKey[modelKey].predictedClass);
    assert.ok(byKey[modelKey].classScores);
    assert.equal(byKey[modelKey].inputModality, MODEL_ROUTING[modelKey]);
  }
});

test("one failed image download does not repeat for every oral model", async (t) => {
  const created = await createAnalysis({ oral: "oral.png" }).expect(202);
  const completed = await waitForTerminal(() => fetchAnalysis(created.body.analysisId));
  assert.equal(completed.status, "completed");
  assert.equal(storage.downloads.length, 0);

  const fetch = globalThis.fetch;
  let downloadAttempts = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (new URL(url).hostname === "api.cloudinary.com") {
      downloadAttempts += 1;
      return new Response("storage unavailable", { status: 503 });
    }
    return fetch(url, options);
  });

  // A direct/restarted job has no in-memory upload bytes and reads storage.
  await runPipeline(created.body.analysisId, completed.inputs, completed.clinicalData, completed.requestedModels);
  const analysis = await fetchAnalysis(created.body.analysisId);

  assert.equal(analysis.status, "failed");
  assert.equal(downloadAttempts, 1);
  for (const result of analysis.modelResults) {
    assert.equal(result.status, result.modelKey === "caries_xray" ? "skipped" : "failed");
  }
});

test("getAnalysis returns 404 for missing id and 403 for another user", async () => {
  await auth(request(app).get("/analyses/507f1f77bcf86cd799439011")).expect(404);

  const created = await createAnalysis({ oral: "oral.png" }).expect(202);
  await waitForTerminal(() => fetchAnalysis(created.body.analysisId));

  const other = await request(app)
    .post("/auth/register")
    .send({ ...signup, email: "other@example.com" })
    .expect(201);

  await request(app)
    .get(`/analyses/${created.body.analysisId}`)
    .set("Authorization", `Bearer ${other.body.token}`)
    .expect(403);
});

test("create accepts omitted clinicalData and still completes", async () => {
  const created = await createAnalysis({ oral: "oral.png" }).expect(202);
  const analysis = await waitForTerminal(() => fetchAnalysis(created.body.analysisId));
  assert.equal(analysis.status, "completed");
  assert.ok(analysis.modelResults.some((r) => r.status === "completed"));
});

test("missing Cloudinary credentials returns 503 without creating an analysis", async () => {
  delete process.env.CLOUDINARY_API_SECRET;
  await createAnalysis({ oral: "oral.png" }).expect(503);
  assert.equal(await analysisModel.countDocuments(), 0);
  assert.equal(storage.uploads.length, 0);
});

test("a second upload failure rolls back the first asset", async (t) => {
  const upload = cloudinary.uploader.upload;
  let calls = 0;
  t.mock.method(cloudinary.uploader, "upload", async (...args) => {
    if (++calls === 2) throw { error: { message: "Cloudinary unavailable" }, http_code: 503 };
    return upload(...args);
  });
  await createAnalysis({ oral: "oral.png", xray: "xray.jpg" }).expect(502);
  assert.equal(await analysisModel.countDocuments(), 0);
  assert.equal(storage.assets.size, 0);
  assert.deepEqual(storage.destroyed, [storage.uploads[0].publicId]);
});

test("database failure rolls back all uploaded assets", async (t) => {
  t.mock.method(analysisModel, "create", async () => { throw new Error("Database unavailable"); });
  await createAnalysis({ oral: "oral.png", xray: "xray.jpg" }).expect(500);
  assert.equal(storage.assets.size, 0);
  assert.equal(storage.destroyed.length, 2);
  for (const upload of storage.uploads) {
    await assert.rejects(access(upload.path), { code: "ENOENT" });
  }
});

test("rejects oversized and unexpected files before Cloudinary upload", async () => {
  await auth(request(app).post("/analyses"))
    .attach("oral_photo", Buffer.alloc(10 * 1024 * 1024 + 1), {
      filename: "large.png", contentType: "image/png",
    }).expect(400);
  await auth(request(app).post("/analyses"))
    .attach("other", fixturePath("oral.png")).expect(400);
  assert.equal(storage.uploads.length, 0);
});

test("streams an uploaded image back to its owner only", async () => {
  const created = await createAnalysis({ oral: "oral.png" }).expect(202);
  const id = created.body.analysisId;
  await waitForTerminal(() => fetchAnalysis(id));

  const image = await auth(request(app).get(`/analyses/${id}/images/oral_photo`)).expect(200);
  assert.equal(image.headers["content-type"], "image/png");
  assert.ok(image.body.length > 0);
  assert.equal(storage.downloads.length, 1);

  await auth(request(app).get(`/analyses/${id}/images/xray`)).expect(404);
  await auth(request(app).get(`/analyses/${id}/images/other`)).expect(404);
  await request(app).get(`/analyses/${id}/images/oral_photo`).expect(401);

  const other = await request(app)
    .post("/auth/register")
    .send({ name: "Other User", email: "other@example.com", password: "valid-password-42" })
    .expect(201);
  await request(app)
    .get(`/analyses/${id}/images/oral_photo`)
    .set("Authorization", `Bearer ${other.body.token}`)
    .expect(403);
});
