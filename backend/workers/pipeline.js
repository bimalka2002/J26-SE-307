import path from "path";
import { readImage } from "../services/imageStorage.js";
import analysisModel from "../models/analysisModel.js";
import { MODEL_ROUTING } from "../config/models.js";

function mlBaseUrl() {
  // index.js loads .env after importing routes, so resolve this at request time.
  return (process.env.ML_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, "");
}

async function callModel(modelKey, input, fileBytes, clinicalData) {
  const form = new FormData();
  form.append(
    "image",
    new Blob([fileBytes], { type: input.mimeType || "application/octet-stream" }),
    input.originalFilename || path.basename(input.storageKey)
  );
  form.append("clinical_data", JSON.stringify(clinicalData || {}));

  const response = await fetch(`${mlBaseUrl()}/predict/${modelKey}`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.detail === "string" ? body.detail : `ML service returned ${response.status}`);
  }
  if (body.modelKey !== modelKey || body.status !== "completed" || !body.classScores) {
    throw new Error(`Unexpected response from ${modelKey} adapter`);
  }
  return body;
}

export function deriveStatus(results) {
  const completed = results.filter((r) => r.status === "completed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  if (failed && completed) return "partial_fail";
  if (failed || !completed) return "failed";
  // A missing modality is expected; its adapter is marked skipped.
  return "completed";
}

export async function runPipeline(analysisId, inputs, clinicalData, requestedModels, imageBytes = new Map()) {
  try {
    await analysisModel.findByIdAndUpdate(analysisId, { status: "running", error: undefined });
    const inputMap = Object.fromEntries(inputs.map((input) => [input.modality, input]));
    // New uploads arrive with their bytes. Older/direct jobs fetch from storage
    // once per image; cache a failed download so it cannot repeat per model.
    const imageDownloads = new Map(imageBytes);
    const results = [];

    for (const modelKey of requestedModels || []) {
      const requiredModality = MODEL_ROUTING[modelKey];
      if (!requiredModality) {
        results.push({ modelKey, status: "failed", inputModality: "oral_photo",
          error: { code: "UNKNOWN_MODEL", message: `Unknown model key: ${modelKey}` } });
        continue;
      }
      const input = inputMap[requiredModality];
      if (!input) {
        results.push({ modelKey, status: "skipped", inputModality: requiredModality,
          error: { code: "MISSING_MODALITY", message: `No ${requiredModality} supplied` } });
        continue;
      }
      try {
        if (!imageDownloads.has(requiredModality)) {
          imageDownloads.set(requiredModality, readImage(input));
        }
        const fileBytes = await imageDownloads.get(requiredModality);
        const result = await callModel(modelKey, input, fileBytes, clinicalData);
        results.push({
          modelKey, modelVersion: result.modelVersion,
          status: "completed", inputModality: requiredModality,
          predictedClass: result.predictedClass,
          classScores: result.classScores,
          bbox: result.bbox ?? null,
          qualityWarning: result.qualityWarning ?? null,
          completedAt: new Date(),
        });
      } catch (err) {
        console.error(`pipeline ${modelKey} error:`, err);
        results.push({ modelKey, status: "failed", inputModality: requiredModality,
          error: { code: "INFERENCE_FAILED", message: err.message }, completedAt: new Date() });
      }
    }

    const status = deriveStatus(results);
    await analysisModel.findByIdAndUpdate(analysisId, {
      status, modelResults: results,
      error: status === "failed"
        ? { code: "PIPELINE_FAILED", message: "No model completed" }
        : undefined,
    });
  } catch (err) {
    console.error("pipeline fatal error:", err);
    try {
      await analysisModel.findByIdAndUpdate(analysisId, {
        status: "failed", error: { code: "PIPELINE_ERROR", message: err.message },
      });
    } catch (saveError) {
      console.error("could not persist pipeline failure:", saveError);
    }
  }
}
