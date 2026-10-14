import fs from "fs/promises";
import path from "path";
import Analysis from "../models/Analysis.js";
import { MODEL_ROUTING } from "../config/models.js";

const ML_BASE = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function callModel(modelKey, input, clinicalData) {
  const fileBytes = await fs.readFile(input.storageKey);
  const filename = input.originalFilename || path.basename(input.storageKey);
  const mime = input.mimeType || "application/octet-stream";

  const form = new FormData();
  form.append("image", new Blob([fileBytes], { type: mime }), filename);
  form.append("clinical_data", JSON.stringify(clinicalData || {}));

  const response = await fetch(`${ML_BASE}/predict/${modelKey}`, {
    method: "POST",
    body: form,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.error || body.message || `ML service returned ${response.status}`;
    throw new Error(message);
  }

  return body;
}

function deriveStatus(results) {
  if (!results.length) return "failed";

  const completed = results.filter((r) => r.status === "completed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  if (completed === results.length) return "completed";
  if (failed === results.length) return "failed";
  if (completed > 0 && (failed > 0 || skipped > 0)) return "partial_fail";
  if (completed > 0) return "completed";
  return "failed";
}

// Runs requested models for one analysis. Currently registry only has ELP.
export async function runPipeline(analysisId, inputs, clinicalData, requestedModels) {
  try {
    await Analysis.findByIdAndUpdate(analysisId, {
      status: "running",
      error: undefined,
    });

    const inputMap = Object.fromEntries(inputs.map((i) => [i.modality, i]));
    const modelsToRun = (requestedModels || []).filter((key) => MODEL_ROUTING[key]);
    const results = [];

    for (const modelKey of modelsToRun) {
      const requiredModality = MODEL_ROUTING[modelKey];
      const input = inputMap[requiredModality];

      if (!input) {
        results.push({
          modelKey,
          status: "skipped",
          inputModality: requiredModality,
        });
        continue;
      }

      try {
        const result = await callModel(modelKey, input, clinicalData);
        results.push({
          modelKey: result.modelKey || modelKey,
          modelVersion: result.modelVersion || "1.0.0",
          status: result.status || "completed",
          inputModality: requiredModality,
          predictedClass: result.predictedClass ?? null,
          classScores: result.classScores || undefined,
          bbox: result.bbox ?? null,
          qualityWarning: result.qualityWarning ?? null,
          completedAt: new Date(),
        });
      } catch (err) {
        console.error(`pipeline ${modelKey} error:`, err.message);
        results.push({
          modelKey,
          status: "failed",
          inputModality: requiredModality,
          error: { code: "INFERENCE_FAILED", message: err.message },
          completedAt: new Date(),
        });
      }
    }

    const status = deriveStatus(results);
    await Analysis.findByIdAndUpdate(analysisId, {
      status,
      modelResults: results,
      ...(status === "failed"
        ? { error: { code: "PIPELINE_FAILED", message: "All requested models failed or were skipped" } }
        : { error: undefined }),
    });
  } catch (err) {
    console.error("pipeline fatal error:", err.message);
    await Analysis.findByIdAndUpdate(analysisId, {
      status: "failed",
      error: { code: "PIPELINE_ERROR", message: err.message },
    });
  }
}
