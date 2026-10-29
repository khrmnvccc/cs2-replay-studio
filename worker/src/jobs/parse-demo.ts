import fs from "node:fs";
import { createHash } from "node:crypto";
import { notify } from "../../../shared/notify";
import { mapMeta } from "../../../shared/maps";
import type { FailureHook, JobHandler } from "../queue";
import { must } from "../lib/db";
import { PermanentError } from "../lib/errors";
import { analyzeDemo } from "../lib/demo-analysis";
import { ensureLocalDemo } from "../lib/demo-cache";

export const parseDemo: JobHandler = async ({ db, config, job, progress }) => {
  const demoFileId = String(job.payload.demoFileId ?? "");
  const demo = must(await db.from("demo_files").select("*").eq("id", demoFileId).maybeSingle(), "demo_files");
  if (demo.user_id !== job.user_id) throw new PermanentError("Ruxsat yo'q");
  const steam = must(await db.from("steam_accounts").select("steam_id64").eq("user_id", job.user_id).maybeSingle(), "steam_accounts");

  await db.from("demo_files").update({ status: "parsing", error: null }).eq("id", demo.id);
  await progress(5, "Demo yuklab olinmoqda");
  const local = await ensureLocalDemo(db, config, demo, (p) => progress(5 + p * 0.45, "Demo yuklab olinmoqda"));

  await progress(55, "Demo tahlil qilinmoqda");
  let a;
  try {
    a = analyzeDemo(local, steam.steam_id64);
  } catch (e) {
    throw new PermanentError(`Demo o'qilmadi: ${(e as Error).message}. Fayl buzilgan yoki CS2 demo emas.`);
  }
  if (!a.rounds.length && !a.kills.length) throw new PermanentError("Demoda raund yoki kill topilmadi");

  await progress(80, "Natijalar saqlanmoqda");
  const sha = await fileSha256(local);
  const matchFields = {
    map_name: a.mapName,
    duration_seconds: a.durationSeconds,
    score_ct: a.scoreCT,
    score_t: a.scoreT,
    user_side: a.user?.side ?? null,
    score_own: a.user?.scoreOwn ?? null,
    score_enemy: a.user?.scoreEnemy ?? null,
    result: a.user?.result ?? null,
    kills: a.user?.kills ?? null,
    deaths: a.user?.deaths ?? null,
    assists: a.user?.assists ?? null,
    headshots: a.user?.headshots ?? null,
    user_in_demo: a.user != null,
    info_source: "demo",
    demo_availability: "uploaded",
  };

  let matchId: string = demo.match_id;
  if (matchId) {
    const existing = must(await db.from("matches").select("id, game_mode").eq("id", matchId).maybeSingle(), "matches");
    must(await db.from("matches").update({ ...matchFields, game_mode: existing.game_mode ?? a.gameMode }).eq("id", matchId).select("id").single(), "match update");
  } else {
    const m = must(
      await db.from("matches").insert({ user_id: job.user_id, source: "demo_upload", game_mode: a.gameMode, ...matchFields }).select("id").single(),
      "match insert",
    );
    matchId = m.id;
  }

  // Qayta tahlil: eski natijalarni almashtiramiz
  await db.from("kill_events").delete().eq("demo_file_id", demo.id);
  await db.from("match_rounds").delete().eq("match_id", matchId);
  if (a.rounds.length) {
    const { error } = await db.from("match_rounds").insert(a.rounds.map((r) => ({ ...r, user_id: job.user_id, match_id: matchId })));
    if (error) throw new Error(`rounds: ${error.message}`);
  }
  for (let i = 0; i < a.kills.length; i += 500) {
    const chunk = a.kills.slice(i, i + 500).map((k) => ({ ...k, user_id: job.user_id, match_id: matchId, demo_file_id: demo.id }));
    const { error } = await db.from("kill_events").insert(chunk);
    if (error) throw new Error(`kill_events: ${error.message}`);
  }
  await db
    .from("demo_files")
    .update({ status: "parsed", match_id: matchId, header: a.header, tickrate: a.tickrate, sha256: sha, error: null })
    .eq("id", demo.id);

  await notify(db, job.user_id, "demo_parsed", {
    map: mapMeta(a.mapName).name,
    score: matchFields.score_own != null ? `${matchFields.score_own} : ${matchFields.score_enemy}` : a.scoreCT != null ? `${a.scoreCT} : ${a.scoreT}` : null,
    kills: a.user?.kills ?? null,
    matchId,
  }, { mapName: a.mapName });
  return { matchId, kills: a.kills.length, rounds: a.rounds.length, userKills: a.user?.kills ?? null, userInDemo: a.user != null };
};

export const parseDemoFailed: FailureHook = async ({ db, job }, error) => {
  await db.from("demo_files").update({ status: "failed", error }).eq("id", String(job.payload.demoFileId ?? ""));
  await notify(db, job.user_id, "demo_failed", { error });
};

function fileSha256(p: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    fs.createReadStream(p).on("data", (d) => h.update(d)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
  });
}
