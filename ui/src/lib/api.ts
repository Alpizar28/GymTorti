
import { createClient } from "./supabase";

// ERROR CONSTANTS
const BACKEND_DISABLED = "Error: Local Backend is DISABLED. This template is Supabase-only.";

// Helper to check environment
function checkEnv() {
  // If we wanted to enforce checks, but let's just make the functions fail.
}

export async function apiGet<T>(path: string): Promise<T> {
  const supabase = createClient();
  console.warn(`[API] Legacy apiGet called for ${path}. This should be replaced by direct Supabase calls.`);

  if (path.includes("/api/clients")) {
    throw new Error("Supabase Tables for Clients (`clients`) not created. Run your business migrations.");
  }

  throw new Error(`${BACKEND_DISABLED} (Path: ${path})`);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  throw new Error(`${BACKEND_DISABLED} (Method: ${method}, Path: ${path})`);
}

export async function apiDownload(path: string): Promise<Blob> {
  throw new Error(`${BACKEND_DISABLED} (Download: ${path})`);
}
