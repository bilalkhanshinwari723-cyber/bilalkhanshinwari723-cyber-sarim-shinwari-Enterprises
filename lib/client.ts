"use client";

// Tiny API client for the app. Throws Error(message) on failure.
export async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const get = <T>(p: string) => api<T>(p);
export const post = <T>(p: string, body: unknown) =>
  api<T>(p, { method: "POST", body: JSON.stringify(body) });
export const put = <T>(p: string, body: unknown) =>
  api<T>(p, { method: "PUT", body: JSON.stringify(body) });
export const del = <T>(p: string) => api<T>(p, { method: "DELETE" });
