import "server-only";
import { z } from "zod";

const schema = z.object({
  APP_URL: z.string().url(),
  // Ixtiyoriy: login usiz ham ishlaydi (ochiq profil XML). Match tarixi uchun kerak.
  STEAM_API_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(20, "STEAM_API_KEY noto'g'ri (https://steamcommunity.com/dev/apikey)").optional()),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET kamida 32 belgi bo'lsin"),
  APP_ENCRYPTION_KEY: z.string().regex(/^[A-Za-z0-9+/]{43}=$/, "APP_ENCRYPTION_KEY: 32 baytli base64 (openssl rand -base64 32)"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_JWT_SECRET: z.string().min(32),
  // Supabase Free plan fayl limiti 50 MB; Pro planda oshiring
  DEMO_MAX_MB: z.coerce.number().int().positive().default(50),
  // Ixtiyoriy: yangi ish tushganda bulutdagi worker'ni darhol uyg'otish (Actions: write ruxsatli token)
  GITHUB_DISPATCH_TOKEN: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  GITHUB_REPO: z.string().default("khrmnvccc/cs2-replay-studio"),
});

/** APP_URL berilmasa Vercel'ning production domenidan olinadi. */
function input(): Record<string, string | undefined> {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return {
    ...process.env,
    APP_URL: process.env.APP_URL || (vercelUrl ? `https://${vercelUrl}` : undefined),
  };
}

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;

/** Muhit o'zgaruvchilarini tekshiradi. Xato bo'lsa — aniq xabar bilan to'xtaydi. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(input());
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ConfigError(`Server sozlanmagan: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function envStatus(): { ok: boolean; missing: string[] } {
  const parsed = schema.safeParse(input());
  if (parsed.success) return { ok: true, missing: [] };
  return { ok: false, missing: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] };
}

export class ConfigError extends Error {}
