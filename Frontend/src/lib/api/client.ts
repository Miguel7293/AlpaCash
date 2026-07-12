import { createClient } from "@/lib/supabase/client";

/**
 * Thin API helper for frontend → Express backend calls.
 *
 * Reads the current Supabase session token and attaches it as
 * `Authorization: Bearer <token>`. Prepends `NEXT_PUBLIC_API_URL`
 * so callers only need to pass the path (e.g. `/api/admin/users`).
 *
 * Throws on non-2xx responses with the status code and body included
 * in the error message so callers can surface it to the UI.
 *
 * @example
 *   const { users } = await fetchApi<{ users: AdminUserDetail[] }>("/api/admin/users?estado=pendiente");
 *   await fetchApi("/api/admin/users/:id/estado", { method: "PATCH", body: JSON.stringify({ estado: "activo" }) });
 */
export async function fetchApi<T = unknown>(
  path: string,
  opts?: RequestInit,
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}
