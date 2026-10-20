import { authed, HttpError, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { enqueueJob, getSteamAccount, JOB_COLUMNS } from "@/lib/server/data";

// "Refresh matches": Valve'dan yangi share code'larni so'rash uchun worker ishini navbatga qo'yadi.
export const POST = authed(async (_req, _ctx, user) => {
  const db = await userDb(user.userId);
  const steam = await getSteamAccount(db);
  if (!steam.history_enabled) {
    throw new HttpError(409, "Avval Settings bo'limida match tarixini ulang (authentication code + share code)");
  }
  const { data: active } = await db
    .from("processing_jobs")
    .select(JOB_COLUMNS)
    .eq("type", "sync_matches")
    .in("status", ["queued", "running"])
    .limit(1);
  if (active?.length) return json({ ok: true, job: active[0], deduped: true });
  const job = await enqueueJob(db, user.userId, "sync_matches", {});
  return json({ ok: true, job });
}, { limit: 6 });
