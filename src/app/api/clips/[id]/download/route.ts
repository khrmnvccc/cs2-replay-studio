import { NextResponse } from "next/server";
import { authed, HttpError } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";

// ?inline=1 — preview uchun (video tegida), aks holda MP4 yuklab olinadi.
// ?thumb=1 — thumbnail rasmi.
export const GET = authed<{ params: Promise<{ id: string }> }>(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const db = await userDb(user.userId);
  const { data: clip } = await db.from("clips").select("title, status, storage_path, thumbnail_path").eq("id", id).maybeSingle();
  if (!clip) throw new HttpError(404, "Clip topilmadi");
  const path = sp.get("thumb") ? clip.thumbnail_path : clip.storage_path;
  if (clip.status !== "ready" || !path) throw new HttpError(409, "Clip hali render qilinmagan");
  const fileName = `${clip.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "clip"}.mp4`;
  const { data, error } = await adminDb()
    .storage.from("clips")
    .createSignedUrl(path, 3600, sp.get("inline") || sp.get("thumb") ? undefined : { download: fileName });
  if (error || !data) throw new HttpError(404, "Fayl topilmadi");
  return NextResponse.redirect(data.signedUrl);
}, { limit: 240 });
