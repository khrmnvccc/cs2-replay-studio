import { notify } from "../../../shared/notify";
import { mapMeta } from "../../../shared/maps";
import type { JobHandler } from "../queue";
import { must } from "../lib/db";
import { PermanentError } from "../lib/errors";
import { requestMatchInfo } from "../lib/gc";
import { steamId64ToAccountId } from "../../../shared/steamid";

// GC dan: sana, davomiylik, jamoa hisobi, foydalanuvchi K/D/A/HS va demo URL.
export const fetchMatchInfo: JobHandler = async ({ db, config, job, progress }) => {
  const shareCode = String(job.payload.shareCode ?? "");
  const match = must(await db.from("matches").select("id, user_id, valve_match_id, info_source, map_name").eq("user_id", job.user_id).eq("share_code", shareCode).maybeSingle(), "match");
  const steam = must(await db.from("steam_accounts").select("steam_id64").eq("user_id", job.user_id).maybeSingle(), "steam");
  await progress(20, "Valve Game Coordinator so'ralmoqda");
  const info = await requestMatchInfo(config, shareCode, match.valve_match_id);
  if (!info) throw new PermanentError("GC bu match uchun ma'lumot qaytarmadi (juda eski bo'lishi mumkin)");

  const idx = info.accountIds.indexOf(steamId64ToAccountId(steam.steam_id64));
  const update: Record<string, unknown> = {
    played_at: info.matchTime ? new Date(info.matchTime * 1000).toISOString() : null,
    demo_url: info.demoUrl,
    demo_availability: info.demoUrl ? "available" : "missing",
  };
  // Demo tahlil qilingan bo'lsa, undagi aniqroq statistikani ustidan yozmaymiz
  if (match.info_source !== "demo") {
    update.duration_seconds = info.durationSeconds;
    update.info_source = "gc";
    if (idx >= 0) {
      // GC: birinchi 5 account — 0-jamoa, keyingi 5 — 1-jamoa; team_scores shu tartibda
      const own = idx < 5 ? 0 : 1;
      const so = info.teamScores[own];
      const se = info.teamScores[1 - own];
      Object.assign(update, {
        kills: info.kills[idx] ?? null,
        deaths: info.deaths[idx] ?? null,
        assists: info.assists[idx] ?? null,
        headshots: info.headshots[idx] ?? null,
        score_own: so ?? null,
        score_enemy: se ?? null,
        result: so == null || se == null ? null : so > se ? "win" : so < se ? "loss" : "tie",
      });
    }
  }
  const { error } = await db.from("matches").update(update).eq("id", match.id);
  if (error) throw new Error(error.message);

  if (info.demoUrl && job.payload.autoDownload) {
    await db.from("processing_jobs").insert({ user_id: job.user_id, type: "download_demo", payload: { matchId: match.id }, max_attempts: 3 });
  }
  const mapName = (update.map_name as string | undefined) ?? match.map_name ?? null;
  await notify(db, job.user_id, "match_imported", {
    map: mapName ? mapMeta(mapName).name : null,
    score: update.score_own != null ? `${update.score_own} : ${update.score_enemy}` : null,
    matchId: match.id,
  }, { mapName });
  return { matchId: match.id, demoUrl: Boolean(info.demoUrl), userFound: idx >= 0 };
};
