import { authed, HttpError, json } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";
import { enqueueJob } from "@/lib/server/data";

export const POST = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: clip } = await db.from("clips").select("id, status").eq("id", id).maybeSingle();
  if (!clip) throw new HttpError(404, "Clip topilmadi");
  if (clip.status !== "failed") throw new HttpError(409, "Faqat xato bilan tugagan clipni qayta render qilish mumkin");
  // status ustunini foydalanuvchi o'zgartira olmaydi (trigger), shuning uchun service_role
  await adminDb().from("clips").update({ status: "queued", error: null }).eq("id", id).eq("user_id", user.userId);
  const job = await enqueueJob(db, user.userId, "render_clip", { clipId: id }, 2);
  return json({ ok: true, job });
}, { limit: 20 });
