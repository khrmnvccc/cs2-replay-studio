import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { env } from "./env";

let admin: SupabaseClient | null = null;

/**
 * service_role klienti — RLS ni chetlab o'tadi. Faqat: login (user/steam upsert),
 * session jadvali va signed URL yaratish uchun. Foydalanuvchi ma'lumotlarini
 * o'qish/yozish uchun userDb() ishlatiladi.
 */
export function adminDb(): SupabaseClient {
  if (admin) return admin;
  const e = env();
  admin = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Supabase uchun foydalanuvchi JWT (auth.uid() = userId). RLS shu orqali ishlaydi. */
export async function mintSupabaseJwt(userId: string, ttlSeconds = 3600): Promise<string> {
  const secret = new TextEncoder().encode(env().SUPABASE_JWT_SECRET);
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);
}

/** RLS bilan cheklangan klient: faqat shu foydalanuvchining qatorlari ko'rinadi. */
export async function userDb(userId: string): Promise<SupabaseClient> {
  const e = env();
  const token = await mintSupabaseJwt(userId);
  return createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
