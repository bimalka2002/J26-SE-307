import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import authRoutes from "../routes/authRoutes.js";
import analysisRoutes from "../routes/analysisRoutes.js";
import User from "../models/userModel.js";
import analysisModel from "../models/analysisModel.js";
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

before(async () => {
  stop = await startMongo();
  await User.init();
  await analysisModel.init();
  await ensureFixtures();
});

after(async () => {
  if (restoreFetch) restoreFetch();
  if (stop) await stop();
});

beforeEach(async () => {
  if (restoreFetch) restoreFetch();
  restoreFetch = installMockMl();
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
  await request(app).get("/analyses/507f1f77bcf86cd799439011").expect(401);
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

  for (const modelKey of DEFAULT_REQUESTED_MODELS) {
    assert.equal(byKey[modelKey].status, "completed");
    assert.ok(byKey[modelKey].predictedClass);
    assert.ok(byKey[modelKey].classScores);
    assert.equal(byKey[modelKey].inputModality, MODEL_ROUTING[modelKey]);
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
