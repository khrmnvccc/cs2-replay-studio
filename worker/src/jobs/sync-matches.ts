import type { FailureHook, JobHandler } from "../queue";
import { PermanentError } from "../lib/errors";
import { HistorySyncError, syncMatchHistory } from "../../../src/lib/steam/sync-history";

// Odatda sayt o'zi sinxronlaydi; bu handler eski navbatdagi ishlar uchun qoldirilgan.
export const syncMatches: JobHandler = async ({ db, config, job, progress }) => {
  try {
    return await syncMatchHistory(db, { apiKey: config.STEAM_API_KEY!, encryptionKey: config.APP_ENCRYPTION_KEY!, userId: job.user_id, progress });
  } catch (e) {
    if (e instanceof HistorySyncError) throw new PermanentError(e.message);
    throw e;
  }
};

export const syncMatchesFailed: FailureHook = async ({ db, job }, error) => {
  await db.from("steam_accounts").update({ history_last_error: error.slice(0, 300) }).eq("user_id", job.user_id);
};
