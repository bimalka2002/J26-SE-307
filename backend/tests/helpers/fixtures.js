import { mkdir, writeFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = join(__dirname, "..", "fixtures");

// Minimal valid 1×1 PNG / JPEG so multer + pipeline fs.readFile succeed.
export const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc00000000300010005fe02fe0000000049454e44ae426082",
  "hex"
);
export const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
  "base64"
);

export async function ensureFixtures() {
  await mkdir(FIXTURES_DIR, { recursive: true });
  await writeFile(join(FIXTURES_DIR, "oral.png"), TINY_PNG);
  // PNG is an allowed upload type; modality comes from the form field name.
  await writeFile(join(FIXTURES_DIR, "xray.png"), TINY_PNG);
  await writeFile(join(FIXTURES_DIR, "xray.jpg"), TINY_JPEG);
}

export function fixturePath(name) {
  return join(FIXTURES_DIR, name);
}

/** Write a temp image the pipeline can read without going through HTTP upload. */
export async function writeTempImage(ext = ".png") {
  const dir = join(FIXTURES_DIR, "tmp");
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${randomUUID()}${ext}`);
  await writeFile(path, ext === ".jpg" ? TINY_JPEG : TINY_PNG);
  return path;
}

export async function cleanTempImages() {
  await rm(join(FIXTURES_DIR, "tmp"), { recursive: true, force: true });
}

/**
 * Mock ML /predict/:modelKey responses.
 * @param {(modelKey: string) => object | Response | Error} [handler]
 */
export function installMockMl(handler) {
  const previous = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const modelKey = String(url).split("/").pop();
    if (typeof handler === "function") {
      const result = handler(modelKey, url);
      if (result instanceof Error) throw result;
      if (result instanceof Response) return result;
      return Response.json(result);
    }
    return Response.json({
      modelKey,
      status: "completed",
      modelVersion: "test-1.0",
      predictedClass: modelKey === "elp" ? "leukoplakia" : "positive",
      classScores:
        modelKey === "elp"
          ? { neither_target: 0.1, leukoplakia: 0.7, erythroplakia: 0.2 }
          : { negative: 0.2, positive: 0.8 },
    });
  };
  return () => {
    globalThis.fetch = previous;
  };
}

export async function waitForTerminal(fetchAnalysis, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const analysis = await fetchAnalysis();
    if (["completed", "failed", "partial_fail"].includes(analysis.status)) {
      return analysis;
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  throw new Error("Timed out waiting for analysis to finish");
}

export function resultMap(analysis) {
  return Object.fromEntries((analysis.modelResults || []).map((r) => [r.modelKey, r]));
}
