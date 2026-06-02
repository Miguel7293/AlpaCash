import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "./env";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (clientInstance) {
    return clientInstance;
  }

  const { url, anonKey } = assertSupabaseEnv();

  clientInstance = createBrowserClient(
    url,
    anonKey
  );

  return clientInstance;
}

