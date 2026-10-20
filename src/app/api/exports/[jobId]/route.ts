import { NextResponse } from "next/server";
import { authed, HttpError } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";

export const GET = authed<{ params: Promise<{ jobId: string }> }>(async (_req, ctx, user) => {
  const { jobId } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: job } = await db.from("processing_jobs").select("type, status, result").eq("id", jobId).maybeSingle();
  if (!job || job.type !== "zip_clips") throw new HttpError(404, "Eksport topilmadi");
  const path = (job.result as { path?: string } | null)?.path;
  if (job.status !== "succeeded" || !path) throw new HttpError(409, "ZIP hali tayyor emas");
  const { data, error } = await adminDb().storage.from("exports").createSignedUrl(path, 600, { download: "cs2-clips.zip" });
  if (error || !data) throw new HttpError(404, "ZIP fayl muddati o'tgan");
  return NextResponse.redirect(data.signedUrl);
});
