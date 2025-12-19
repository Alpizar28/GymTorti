export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const GYM_ID = process.env.NEXT_PUBLIC_GYM_ID ?? "1";

function gymHeaders() {
  const gymId = GYM_ID?.trim();
  if (!gymId) throw new Error("NEXT_PUBLIC_GYM_ID no está configurado");
  return { "X-GYM-ID": gymId };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: { ...gymHeaders() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...gymHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }

  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}
