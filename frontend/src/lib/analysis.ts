import { ApiError, TOKEN_KEY } from "@/lib/auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export type AnalysisStatus = "queued" | "running" | "completed" | "failed" | "partial_fail";

export type ModelResult = {
  modelKey: string;
  modelVersion?: string | null;
  status: "completed" | "failed" | "skipped";
  inputModality: "oral_photo" | "xray";
  predictedClass?: string | null;
  classScores?: Record<string, number> | null;
  qualityWarning?: string | null;
  error?: { code?: string; message?: string } | null;
  completedAt?: string | null;
};

export type AnalysisInput = {
  modality: "oral_photo" | "xray";
  originalFilename?: string;
  mimeType?: string;
};

export type Analysis = {
  _id: string;
  status: AnalysisStatus;
  requestedModels: string[];
  inputs?: AnalysisInput[];
  clinicalData?: Record<string, unknown>;
  modelResults?: ModelResult[];
  report?: { text?: string | null };
  error?: { code?: string; message?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAnalysisResponse = {
  analysisId: string;
  status: AnalysisStatus;
  requestedModels: string[];
};

function authToken(): string {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
  return token;
}

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function createAnalysis(formData: FormData): Promise<CreateAnalysisResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken()}` },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error("Unable to reach OralScan. Check your connection and try again.");
  }

  const data = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(data.message || "Unable to start analysis. Please try again.", response.status);
  }
  return data as CreateAnalysisResponse;
}

export async function getAnalysis(id: string): Promise<Analysis> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyses/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Unable to reach OralScan. Check your connection and try again.");
  }

  const data = await parseJson(response);
  if (!response.ok) {
    throw new ApiError(data.message || "Unable to load analysis.", response.status);
  }
  return (data.analysis ?? data) as Analysis;
}

export const TERMINAL_STATUSES: AnalysisStatus[] = ["completed", "failed", "partial_fail"];

export function isTerminal(status: AnalysisStatus) {
  return TERMINAL_STATUSES.includes(status);
}

export const MODEL_LABELS: Record<string, string> = {
  olp: "Oral lichen planus",
  osmf: "Oral submucous fibrosis",
  elp: "Leukoplakia / erythroplakia",
  caries: "Dental caries",
  caries_intraoral: "Caries (intraoral)",
  caries_xray: "Caries (X-ray)",
};

export function modelLabel(key: string) {
  return MODEL_LABELS[key] || key.toUpperCase();
}

// Fetched with the bearer token (an <img src> cannot send one), so callers get a Blob to preview.
export async function getAnalysisImage(id: string, modality: AnalysisInput["modality"]): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyses/${encodeURIComponent(id)}/images/${modality}`, {
      headers: { Authorization: `Bearer ${authToken()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error("Unable to reach OralScan. Check your connection and try again.");
  }
  if (!response.ok) throw new ApiError("Image preview is not available.", response.status);
  return response.blob();
}

// The classes each model uses to say "nothing found"; any other predicted class is a flag.
const NEGATIVE_CLASSES = new Set(["negative", "neither_target", "no_caries"]);

export const CLASS_LABELS: Record<string, string> = {
  negative: "No signs",
  positive: "Signs present",
  neither_target: "Neither",
  leukoplakia: "Leukoplakia",
  erythroplakia: "Erythroplakia",
  no_caries: "No caries",
  caries: "Caries",
};

export function classLabel(name: string) {
  return CLASS_LABELS[name] || name.replace(/_/g, " ");
}

export function isNegativeClass(name: string) {
  return NEGATIVE_CLASSES.has(name);
}

export function isFlagged(result: ModelResult) {
  return result.status === "completed" && !!result.predictedClass && !isNegativeClass(result.predictedClass);
}

// Caries is checked on both the photo and the X-ray, but counts as one condition.
export function conditionOf(modelKey: string) {
  return modelKey.startsWith("caries") ? "caries" : modelKey;
}

const CONDITION_ORDER = ["olp", "osmf", "elp", "caries"];

export function sortResults(results: ModelResult[]) {
  const rank = (result: ModelResult) => {
    const index = CONDITION_ORDER.indexOf(conditionOf(result.modelKey));
    return index === -1 ? CONDITION_ORDER.length : index;
  };
  return [...results].sort((a, b) => rank(a) - rank(b) || a.inputModality.localeCompare(b.inputModality));
}

export type Summary = {
  screened: number;
  flagged: number;
  notScreened: number;
  failed: number;
};

export function summarize(results: ModelResult[]): Summary {
  const groups = new Map<string, ModelResult[]>();
  for (const result of results) {
    const key = conditionOf(result.modelKey);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  const summary: Summary = { screened: 0, flagged: 0, notScreened: 0, failed: 0 };
  for (const group of groups.values()) {
    if (group.some((r) => r.status === "completed")) {
      summary.screened += 1;
      if (group.some(isFlagged)) summary.flagged += 1;
    } else if (group.some((r) => r.status === "failed")) {
      summary.failed += 1;
    } else {
      summary.notScreened += 1;
    }
  }
  return summary;
}
