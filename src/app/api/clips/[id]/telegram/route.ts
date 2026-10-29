import { authed, HttpError, json } from "@/lib/server/http";
import { sendClipToTelegram } from "@/lib/server/clip-telegram";
import { userDb } from "@/lib/server/supabase";

export const POST = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: clip } = await db.from("clips").select("title, status, storage_path").eq("id", id).maybeSingle();
  if (!clip) throw new HttpError(404, "Clip topilmadi");
  if (clip.status !== "ready" || !clip.storage_path) throw new HttpError(409, "Clip hali render qilinmagan");
  const status = await sendClipToTelegram(user.userId, clip);
  if (status === "skipped") throw new HttpError(409, "Avval Telegram'ni ulang (Menyu → Telegram)");
  if (status === "failed") throw new HttpError(502, "Telegram'ga yuborib bo'lmadi");
  return json({ ok: true });
}, { limit: 20 });
