import { authed, HttpError, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { enqueueJob, getMatch } from "@/lib/server/data";

// Valve replay serveridagi demo'ni (GC bergan URL) storage'ga yuklab, tahlil qilish.
export const POST = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { match } = await getMatch(db, id);
  if (!match.demo_url || match.demo_availability !== "available") {
    throw new HttpError(409, "Bu match uchun Valve demo havolasi yo'q. Demo faylni o'zingiz yuklang.");
  }
  const job = await enqueueJob(db, user.userId, "download_demo", { matchId: match.id });
  return json({ ok: true, job });
}, { limit: 10 });
