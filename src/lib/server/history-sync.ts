import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HistorySyncError, syncMatchHistory } from "@/lib/steam/sync-history";
import { enqueueJob, JOB_COLUMNS } from "./data";
import { env } from "./env";
import { adminDb } from "./supabase";
import type { JobRow } from "@/lib/types";

/**
 * Match tarixini sinxronlash. Kalit serverda bo'lsa, ish saytning o'zida (javobdan keyin)
 * bajariladi — kompyuterdagi worker'ga Steam kaliti kerak emas. Ish odatdagidek
 * processing_jobs'da ko'rinadi, shuning uchun UI uni kuzata oladi.
 */
export async function startHistorySync(db: SupabaseClient, userId: string): Promise<JobRow> {
  const e = env();
  if (!e.STEAM_API_KEY) return enqueueJob(db, userId, "sync_matches", {});
  const apiKey = e.STEAM_API_KEY;
  const admin = adminDb();
  const { data: job, error } = await admin
    .from("processing_jobs")
    .insert({ user_id: userId, type: "sync_matches", payload: {}, status: "running", locked_by: "web", locked_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(), attempts: 1, max_attempts: 1 })
    .select(JOB_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  after(async () => {
    const update = (patch: Record<string, unknown>) => admin.from("processing_jobs").update(patch).eq("id", job.id);
    try {
      const result = await syncMatchHistory(admin, {
        apiKey,
        encryptionKey: e.APP_ENCRYPTION_KEY,
        userId,
        progress: (progress, progress_message) => update({ progress, progress_message, heartbeat_at: new Date().toISOString() }),
      });
      await update({ status: "succeeded", progress: 100, progress_message: null, result, locked_by: null });
    } catch (err) {
      const msg = err instanceof HistorySyncError ? err.message : "Valve'dan match tarixini olib bo'lmadi, birozdan keyin qayta urinib ko'ring";
      if (!(err instanceof HistorySyncError)) console.error("history sync", err);
      await admin.from("steam_accounts").update({ history_last_error: msg.slice(0, 300) }).eq("user_id", userId);
      await update({ status: "failed", error: msg, locked_by: null });
    }
  });
  return job as unknown as JobRow;
}
