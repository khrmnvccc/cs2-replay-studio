import { z } from "zod";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { decodeShareCode, isValidShareCode } from "@shared/sharecode";
import { after } from "next/server";
import { wakeCloudWorker } from "@/lib/server/worker-wake";

const body = z.object({ text: z.string().max(5000) });
const CODE_RE = /CSGO(?:-[A-Za-z0-9]{5}){5}/g;

// Share code (yoki CS2 "share link") orqali matchlarni qo'lda qo'shish. Steam API kaliti kerak emas:
// tafsilotlar va demo havolasini GC bot worker (fetch_match_info) oladi.
export const POST = authed(async (req, _ctx, user) => {
  const { text } = await parseBody(req, body);
  const codes = [...new Set(text.match(CODE_RE) ?? [])].filter(isValidShareCode).slice(0, 20);
  if (!codes.length) throw new HttpError(400, "Share code topilmadi. Format: CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx");

  const db = await userDb(user.userId);
  const rows = codes.map((shareCode) => {
    const d = decodeShareCode(shareCode);
    return {
      user_id: user.userId,
      source: "sharecode",
      share_code: shareCode,
      valve_match_id: d.matchId,
      valve_outcome_id: d.outcomeId,
      valve_token: String(d.token),
      game_mode: "Matchmaking",
    };
  });
  const { data: inserted, error } = await db
    .from("matches")
    .upsert(rows, { onConflict: "user_id,share_code", ignoreDuplicates: true })
    .select("share_code");
  if (error) throw new Error(error.message);

  const fresh = (inserted ?? []).map((r) => r.share_code as string);
  if (fresh.length) {
    const { error: jobErr } = await db.from("processing_jobs").insert(
      fresh.map((shareCode) => ({ user_id: user.userId, type: "fetch_match_info", payload: { shareCode, autoDownload: true }, max_attempts: 3 })),
    );
    if (jobErr) throw new Error(jobErr.message);
    after(wakeCloudWorker);
  }
  return json({ ok: true, added: fresh.length, skipped: codes.length - fresh.length });
}, { limit: 20 });
