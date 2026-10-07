import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

// Only import in server modules. This key bypasses RLS and must never enter a client bundle.
export function createServiceSupabase() {
  if (typeof window !== "undefined")
    throw new Error("Server-only Supabase client.");
  const { url } = supabaseConfig();
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Chưa cấu hình Supabase server key.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal || AbortSignal.timeout(15000),
        }),
    },
  });
}
