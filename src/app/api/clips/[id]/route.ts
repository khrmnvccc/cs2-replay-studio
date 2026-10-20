import { z } from "zod";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";
import { CLIP_COLUMNS } from "@/lib/server/data";

const patch = z.object({ title: z.string().trim().min(1, "Nom bo'sh bo'lmasin").max(120) });

export const PATCH = authed<{ params: Promise<{ id: string }> }>(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const { title } = await parseBody(req, patch);
  const db = await userDb(user.userId);
  const { data, error } = await db.from("clips").update({ title }).eq("id", id).select(CLIP_COLUMNS).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, "Clip topilmadi");
  return json({ ok: true, clip: data });
});

export const DELETE = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: clip } = await db.from("clips").select("id, storage_path, thumbnail_path").eq("id", id).maybeSingle();
  if (!clip) throw new HttpError(404, "Clip topilmadi");
  const files = [clip.storage_path, clip.thumbnail_path].filter(Boolean) as string[];
  if (files.length) await adminDb().storage.from("clips").remove(files);
  const { error } = await db.from("clips").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return json({ ok: true });
});
