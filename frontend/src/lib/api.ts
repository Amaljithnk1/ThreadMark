const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers ?? {}) } });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message ?? "Something went wrong. Please try again."); }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}
