import { authed, HttpError, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { enqueueJob } from "@/lib/server/data";

// Xato bilan tugagan ishni qayta navbatga qo'yish (yangi job sifatida)
export const POST = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: job } = await db.from("processing_jobs").select("type, status, payload, max_attempts").eq("id", id).maybeSingle();
  if (!job) throw new HttpError(404, "Ish topilmadi");
  if (job.status !== "failed") throw new HttpError(409, "Faqat xato bilan tugagan ishni qayta urinish mumkin");
  if (job.type === "render_clip") throw new HttpError(409, "Clip uchun My Clips sahifasidagi 'Qayta render' tugmasidan foydalaning");
  const next = await enqueueJob(db, user.userId, job.type, job.payload, job.max_attempts);
  return json({ ok: true, job: next });
}, { limit: 20 });
