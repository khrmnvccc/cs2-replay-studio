import type { SupabaseClient } from "@supabase/supabase-js";
import { getNextMatchSharingCode } from "./web-api";
import { decryptSecret } from "../../../shared/secret-box";
import { decodeShareCode } from "../../../shared/sharecode";

const MAX_PER_RUN = 50;

/** Qayta urinish foyda bermaydigan sinxronlash xatosi (kod yaroqsiz va h.k.). */
export class HistorySyncError extends Error {}

type Opts = {
  apiKey: string;
  encryptionKey: string;
  userId: string;
  progress?: (pct: number, message: string) => PromiseLike<unknown>;
};

// Valve match history: oxirgi ma'lum share code'dan boshlab keyingilarini so'raydi.
// Har bir yangi share code — haqiqiy match. Tafsilotlar (hisob, K/D, demo URL) uchun
// GC bot (fetch_match_info) yoki demo tahlili kerak. Sayt (Vercel) ham, worker ham shu
// funksiyani ishlatadi; db — service_role klienti.
export async function syncMatchHistory(db: SupabaseClient, { apiKey, encryptionKey, userId, progress }: Opts) {
  const { data: acc, error: accErr } = await db
    .from("steam_accounts")
    .select("steam_id64, auth_code_encrypted, last_share_code, history_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (accErr) throw new Error(accErr.message);
  if (!acc?.history_enabled || !acc.auth_code_encrypted || !acc.last_share_code) throw new HistorySyncError("Match tarixi ulanmagan");
  const authCode = decryptSecret(acc.auth_code_encrypted, encryptionKey);
  const { data: settingsRow } = await db.from("users").select("settings").eq("id", userId).single();
  const autoDownload = Boolean(settingsRow?.settings?.auto_download_demos);

  let known: string = acc.last_share_code;
  const found: string[] = [];
  for (let i = 0; i < MAX_PER_RUN; i++) {
    await progress?.(Math.min(90, 5 + i * 2), `Valve'dan match tarixi so'ralmoqda (${found.length} ta yangi)`);
    const r = await getNextMatchSharingCode(apiKey, acc.steam_id64, authCode, known);
    if (r.kind === "none") break;
    if (r.kind === "invalid_auth") {
      await db.from("steam_accounts").update({ history_last_error: "Authentication code yaroqsiz — qayta kiriting", history_enabled: false }).eq("user_id", userId);
      throw new HistorySyncError("Steam authentication code yaroqsiz (yangilangan bo'lishi mumkin)");
    }
    if (r.kind === "invalid_known_code") {
      await db.from("steam_accounts").update({ history_last_error: "Share code yaroqsiz — yangi share code kiriting" }).eq("user_id", userId);
      throw new HistorySyncError("Oxirgi share code Valve tomonidan rad etildi");
    }
    found.push(r.code);
    known = r.code;
    await new Promise((res) => setTimeout(res, 400)); // Steam API rate limit'ga hurmat
  }

  // Avval saqlangan, lekin hali tafsiloti olinmagan matchlar ham GC navbatiga
  const { data: pending } = await db.from("matches").select("share_code").eq("user_id", userId).eq("source", "sharecode").is("played_at", null);
  const codes = new Set([...found, ...((pending ?? []).map((p) => p.share_code).filter(Boolean) as string[])]);

  for (const code of found) {
    const d = decodeShareCode(code);
    const { error } = await db.from("matches").upsert(
      { user_id: userId, source: "sharecode", share_code: code, valve_match_id: d.matchId, valve_outcome_id: d.outcomeId, valve_token: String(d.token), game_mode: "Matchmaking" },
      { onConflict: "user_id,share_code", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
  }
  await db.from("steam_accounts").update({ last_share_code: known, history_last_synced_at: new Date().toISOString(), history_last_error: null }).eq("user_id", userId);

  // GC tafsilotlari uchun ish (faqat hali so'ralmaganlar)
  if (codes.size) {
    const { data: queued } = await db.from("processing_jobs").select("payload").eq("user_id", userId).eq("type", "fetch_match_info").in("status", ["queued", "running"]);
    const already = new Set((queued ?? []).map((q) => q.payload?.shareCode));
    const rows = [...codes].filter((c) => !already.has(c)).map((shareCode) => ({ user_id: userId, type: "fetch_match_info", payload: { shareCode, autoDownload }, max_attempts: 3 }));
    if (rows.length) await db.from("processing_jobs").insert(rows);
  }
  return { newMatches: found.length, lastShareCode: known };
}
