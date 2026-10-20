import type { FailureHook, JobHandler } from "../queue";
import { must } from "../lib/db";
import { PermanentError } from "../lib/errors";
import { getNextMatchSharingCode } from "../../../src/lib/steam/web-api";
import { decryptSecret } from "../../../shared/secret-box";
import { decodeShareCode } from "../../../shared/sharecode";

const MAX_PER_RUN = 50;

// Valve match history: oxirgi ma'lum share code'dan boshlab keyingilarini so'raydi.
// Har bir yangi share code — haqiqiy match. Tafsilotlar (hisob, K/D, demo URL) uchun
// GC bot (fetch_match_info) yoki demo tahlili kerak.
export const syncMatches: JobHandler = async ({ db, config, job, progress }) => {
  const acc = must(
    await db.from("steam_accounts").select("steam_id64, auth_code_encrypted, last_share_code, history_enabled").eq("user_id", job.user_id).maybeSingle(),
    "steam_accounts",
  );
  if (!acc.history_enabled || !acc.auth_code_encrypted || !acc.last_share_code) throw new PermanentError("Match tarixi ulanmagan");
  const authCode = decryptSecret(acc.auth_code_encrypted, config.APP_ENCRYPTION_KEY!);
  const { data: settingsRow } = await db.from("users").select("settings").eq("id", job.user_id).single();
  const autoDownload = Boolean(settingsRow?.settings?.auto_download_demos);

  let known: string = acc.last_share_code;
  const found: string[] = [];
  for (let i = 0; i < MAX_PER_RUN; i++) {
    await progress(Math.min(90, 5 + i * 2), `Valve'dan match tarixi so'ralmoqda (${found.length} ta yangi)`);
    const r = await getNextMatchSharingCode(config.STEAM_API_KEY!, acc.steam_id64, authCode, known);
    if (r.kind === "none") break;
    if (r.kind === "invalid_auth") {
      await db.from("steam_accounts").update({ history_last_error: "Authentication code yaroqsiz — qayta kiriting", history_enabled: false }).eq("user_id", job.user_id);
      throw new PermanentError("Steam authentication code yaroqsiz (yangilangan bo'lishi mumkin)");
    }
    if (r.kind === "invalid_known_code") {
      await db.from("steam_accounts").update({ history_last_error: "Share code yaroqsiz — yangi share code kiriting" }).eq("user_id", job.user_id);
      throw new PermanentError("Oxirgi share code Valve tomonidan rad etildi");
    }
    found.push(r.code);
    known = r.code;
    await new Promise((res) => setTimeout(res, 400)); // Steam API rate limit'ga hurmat
  }

  // Avval saqlangan, lekin hali tafsiloti olinmagan matchlar ham GC navbatiga
  const { data: pending } = await db.from("matches").select("share_code").eq("user_id", job.user_id).eq("source", "sharecode").is("played_at", null);
  const codes = new Set([...found, ...((pending ?? []).map((p) => p.share_code).filter(Boolean) as string[])]);

  for (const code of found) {
    const d = decodeShareCode(code);
    const { error } = await db.from("matches").upsert(
      { user_id: job.user_id, source: "sharecode", share_code: code, valve_match_id: d.matchId, valve_outcome_id: d.outcomeId, valve_token: String(d.token), game_mode: "Matchmaking" },
      { onConflict: "user_id,share_code", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
  }
  await db.from("steam_accounts").update({ last_share_code: known, history_last_synced_at: new Date().toISOString(), history_last_error: null }).eq("user_id", job.user_id);

  // GC tafsilotlari uchun ish (faqat hali so'ralmaganlar)
  if (codes.size) {
    const { data: queued } = await db.from("processing_jobs").select("payload").eq("user_id", job.user_id).eq("type", "fetch_match_info").in("status", ["queued", "running"]);
    const already = new Set((queued ?? []).map((q) => q.payload?.shareCode));
    const rows = [...codes].filter((c) => !already.has(c)).map((shareCode) => ({ user_id: job.user_id, type: "fetch_match_info", payload: { shareCode, autoDownload }, max_attempts: 3 }));
    if (rows.length) await db.from("processing_jobs").insert(rows);
  }
  return { newMatches: found.length, lastShareCode: known };
};

export const syncMatchesFailed: FailureHook = async ({ db, job }, error) => {
  await db.from("steam_accounts").update({ history_last_error: error.slice(0, 300) }).eq("user_id", job.user_id);
};
