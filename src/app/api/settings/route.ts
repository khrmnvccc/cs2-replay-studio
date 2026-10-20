import { z } from "zod";
import { authed, json, parseBody } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { getSettings } from "@/lib/server/data";

const schema = z
  .object({
    clip_pre_seconds: z.number().min(0).max(30),
    clip_post_seconds: z.number().min(0).max(30),
    video_resolution: z.enum(["1280x720", "1920x1080", "2560x1440"]),
    video_fps: z.union([z.literal(30), z.literal(60), z.literal(120)]),
    retention_days: z.number().int().min(1).max(365),
    auto_download_demos: z.boolean(),
  })
  .partial();

export const PATCH = authed(async (req, _ctx, user) => {
  const patch = await parseBody(req, schema);
  const db = await userDb(user.userId);
  const current = await getSettings(db);
  const settings = { ...current, ...patch };
  const { error } = await db.from("users").update({ settings }).eq("id", user.userId);
  if (error) throw new Error(error.message);
  return json({ ok: true, settings });
}, { limit: 30 });
