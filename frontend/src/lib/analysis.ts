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

export type Analysis = {
  _id: string;
  status: AnalysisStatus;
  requestedModels: string[];
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
