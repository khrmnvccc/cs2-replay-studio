import { z } from "zod";
import os from "node:os";

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  STEAM_API_KEY: z.string().optional(),
  APP_ENCRYPTION_KEY: z.string().optional(),
  WORKER_ID: z.string().default(`${os.hostname()}-${process.pid}`),
  /** vergul bilan: parse,sync,gc,zip,render */
  WORKER_CAPABILITIES: z.string().default("parse,sync,zip"),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  WORK_DIR: z.string().default(os.tmpdir() + "/cs2-replay-worker"),
  /** Supabase Storage fayl limiti (Free plan: 50 MB). Kattaroq Valve demolari storage'ga yuklanmaydi. */
  DEMO_STORAGE_MAX_MB: z.coerce.number().positive().default(50),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  // Valve Game Coordinator (match tafsilotlari + demo URL) uchun alohida bot akkaunt
  STEAM_BOT_USERNAME: z.string().optional(),
  STEAM_BOT_PASSWORD: z.string().optional(),
  STEAM_BOT_SHARED_SECRET: z.string().optional(),
  STEAM_BOT_REFRESH_TOKEN: z.string().optional(),
  // Render (faqat Windows + CS2 + HLAE)
  RENDER_BACKEND: z.enum(["csdm", "command"]).optional(),
  CSDM_PATH: z.string().default("csdm"),
  RENDER_COMMAND: z.string().optional(),
  RENDER_TIMEOUT_MINUTES: z.coerce.number().positive().default(20),
});

export type Config = z.infer<typeof schema> & { capabilities: Set<string> };

export function loadConfig(): Config {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Worker sozlanmagan: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const c = parsed.data;
  const capabilities = new Set(c.WORKER_CAPABILITIES.split(",").map((s) => s.trim()).filter(Boolean));
  const problems: string[] = [];
  // Match tarixini odatda sayt o'zi sinxronlaydi; worker'da kalit bo'lmasa, "sync" faqat Valve demolarini yuklaydi.
  if (capabilities.has("gc") && !c.STEAM_BOT_REFRESH_TOKEN && !(c.STEAM_BOT_USERNAME && c.STEAM_BOT_PASSWORD))
    problems.push("gc uchun STEAM_BOT_REFRESH_TOKEN yoki STEAM_BOT_USERNAME + STEAM_BOT_PASSWORD kerak");
  if (capabilities.has("render")) {
    if (!c.RENDER_BACKEND) problems.push("render uchun RENDER_BACKEND=csdm yoki command kerak");
    if (c.RENDER_BACKEND === "command" && !c.RENDER_COMMAND) problems.push("RENDER_BACKEND=command uchun RENDER_COMMAND kerak");
    if (process.platform !== "win32") console.warn("[config] Ogohlantirish: CS2 + HLAE render faqat Windows'da ishlaydi.");
  }
  if (problems.length) throw new Error("Worker sozlamasi: " + problems.join("; "));
  return { ...c, capabilities };
}
