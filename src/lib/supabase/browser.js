import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

let client;

export function getBrowserSupabase() {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv();
    client = createBrowserClient(url, publishableKey);
  }

  return client;
}
