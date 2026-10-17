export type User = { id: string; name: string; email: string; role: "general" | "clinical" | "admin" };
export type Session = { token: string; user: User };
export const TOKEN_KEY = "oralscan.auth.token";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function authRequest<T>(path: string, body?: object, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("Unable to reach OralScan. Check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.message || "Something went wrong. Please try again.", response.status);
  return data as T;
}

// Only authenticated OralScan app routes are allowed return targets.
export function returnPath(value: string | null): string {
  if (
    !value ||
    /[\\\r\n]/.test(value) ||
    !/^\/app(?:\/[A-Za-z0-9._-]+)*(?:[?#]|$)/.test(value)
  ) {
    return "/app";
  }
  return value;
}
