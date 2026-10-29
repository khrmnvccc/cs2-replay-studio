import { authed, HttpError, json } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";
import { isExternalDemoPath } from "@shared/demo-file";

export const DELETE = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: demo } = await db.from("demo_files").select("id, storage_path").eq("id", id).maybeSingle();
  if (!demo) throw new HttpError(404, "Demo topilmadi");
  // Demo o'chsa unga bog'liq kill eventlar va cliplar ham o'chadi (FK cascade) — fayllarini ham tozalaymiz
  const { data: clips } = await db.from("clips").select("storage_path, thumbnail_path").eq("demo_file_id", id);
  const clipFiles = (clips ?? []).flatMap((c) => [c.storage_path, c.thumbnail_path]).filter(Boolean) as string[];
  const admin = adminDb();
  if (clipFiles.length) await admin.storage.from("clips").remove(clipFiles);
  if (!isExternalDemoPath(demo.storage_path)) await admin.storage.from("demos").remove([demo.storage_path]);
  const { error } = await db.from("demo_files").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return json({ ok: true });
});
