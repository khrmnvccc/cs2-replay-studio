import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../config";

export function serviceDb(c: Config): SupabaseClient {
  return createClient(c.SUPABASE_URL, c.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function must<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  if (res.data == null) throw new Error(`${what}: topilmadi`);
  return res.data as NonNullable<T>;
}
