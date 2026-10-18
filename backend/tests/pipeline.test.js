import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import analysisModel from "../models/analysisModel.js";
import { DEFAULT_REQUESTED_MODELS, MODEL_ROUTING } from "../config/models.js";
import { deriveStatus, runPipeline } from "../workers/pipeline.js";
import { startMongo } from "./helpers/mongo.js";
import {
  cleanTempImages,
  installMockMl,
  resultMap,
  writeTempImage,
} from "./helpers/fixtures.js";

let stop;
let restoreFetch;

before(async () => {
  stop = await startMongo();
  await analysisModel.init();
});

after(async () => {
  if (restoreFetch) restoreFetch();
  await cleanTempImages();
  if (stop) await stop();
});

beforeEach(async () => {
  if (restoreFetch) restoreFetch();
  restoreFetch = installMockMl();
  await analysisModel.deleteMany({});
  await cleanTempImages();
});

function oralInput(path) {
  return {
    modality: "oral_photo",
    storageKey: path,
    originalFilename: "oral.png",
    mimeType: "image/png",
    sizeBytes: 100,
  };
}

function xrayInput(path) {
  return {
    modality: "xray",
    storageKey: path,
    originalFilename: "xray.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 100,
  };
}

async function runWith(inputs, requestedModels = [...DEFAULT_REQUESTED_MODELS]) {
  const doc = await analysisModel.create({
    userId: "507f1f77bcf86cd799439011",
    inputs,
    clinicalData: { age: 42 },
    requestedModels,
    status: "queued",
  });
  await runPipeline(doc._id, inputs, { age: 42 }, requestedModels);
  return analysisModel.findById(doc._id).lean();
}

test("deriveStatus: completed when only skips or all complete; failed / partial_fail otherwise", () => {
  assert.equal(deriveStatus([{ status: "completed" }, { status: "skipped" }]), "completed");
  assert.equal(deriveStatus([{ status: "skipped" }, { status: "skipped" }]), "failed");
  assert.equal(deriveStatus([{ status: "failed" }]), "failed");
  assert.equal(
    deriveStatus([{ status: "completed" }, { status: "failed" }, { status: "skipped" }]),
    "partial_fail"
  );
});

test("oral_photo only: photo models complete, xray model skipped", async () => {
  const path = await writeTempImage(".png");
  const analysis = await runWith([oralInput(path)]);
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "completed");
  for (const [modelKey, modality] of Object.entries(MODEL_ROUTING)) {
    assert.ok(byKey[modelKey], `missing result for ${modelKey}`);
    if (modality === "oral_photo") {
      assert.equal(byKey[modelKey].status, "completed");
      assert.equal(byKey[modelKey].inputModality, "oral_photo");
      assert.ok(byKey[modelKey].classScores);
      assert.ok(byKey[modelKey].predictedClass);
    } else {
      assert.equal(byKey[modelKey].status, "skipped");
      assert.equal(byKey[modelKey].error.code, "MISSING_MODALITY");
    }
  }
});

test("xray only: caries_xray completes, oral_photo models skipped", async () => {
  const path = await writeTempImage(".jpg");
  const analysis = await runWith([xrayInput(path)]);
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "completed");
  for (const [modelKey, modality] of Object.entries(MODEL_ROUTING)) {
    if (modality === "xray") {
      assert.equal(byKey[modelKey].status, "completed");
      assert.equal(byKey[modelKey].inputModality, "xray");
    } else {
      assert.equal(byKey[modelKey].status, "skipped");
      assert.equal(byKey[modelKey].error.code, "MISSING_MODALITY");
    }
  }
});

test("oral_photo + xray: every requested model completes", async () => {
  const oral = await writeTempImage(".png");
  const xray = await writeTempImage(".jpg");
  const analysis = await runWith([oralInput(oral), xrayInput(xray)]);
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "completed");
  assert.equal(analysis.modelResults.length, DEFAULT_REQUESTED_MODELS.length);
  for (const modelKey of DEFAULT_REQUESTED_MODELS) {
    assert.equal(byKey[modelKey].status, "completed");
    assert.equal(byKey[modelKey].inputModality, MODEL_ROUTING[modelKey]);
  }
});

test("unknown model key is failed; remaining models still run", async () => {
  const path = await writeTempImage(".png");
  const analysis = await runWith([oralInput(path)], ["elp", "not_a_real_model"]);
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "partial_fail");
  assert.equal(byKey.elp.status, "completed");
  assert.equal(byKey.not_a_real_model.status, "failed");
  assert.equal(byKey.not_a_real_model.error.code, "UNKNOWN_MODEL");
});

test("ML adapter failure marks that model failed and yields partial_fail when others succeed", async () => {
  restoreFetch();
  restoreFetch = installMockMl((modelKey) => {
    if (modelKey === "olp") {
      return new Response(JSON.stringify({ detail: "adapter crashed" }), { status: 500 });
    }
    return {
      modelKey,
      status: "completed",
      modelVersion: "test-1.0",
      predictedClass: "positive",
      classScores: { negative: 0.1, positive: 0.9 },
    };
  });

  const path = await writeTempImage(".png");
  const analysis = await runWith([oralInput(path)], ["olp", "elp"]);
  const byKey = resultMap(analysis);

  assert.equal(analysis.status, "partial_fail");
  assert.equal(byKey.olp.status, "failed");
  assert.equal(byKey.olp.error.code, "INFERENCE_FAILED");
  assert.equal(byKey.elp.status, "completed");
});

test("all ML failures yield failed status with PIPELINE_FAILED error", async () => {
  restoreFetch();
  restoreFetch = installMockMl(() => new Response(JSON.stringify({ detail: "down" }), { status: 503 }));

  const path = await writeTempImage(".png");
  const analysis = await runWith([oralInput(path)], ["elp"]);

  assert.equal(analysis.status, "failed");
  assert.equal(analysis.error.code, "PIPELINE_FAILED");
  assert.equal(analysis.modelResults[0].status, "failed");
});
