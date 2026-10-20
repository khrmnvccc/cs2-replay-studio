// CS2 demo tahlili (@laihoe/demoparser2 — Rust asosidagi ochiq kodli parser).
// Natija: header, raundlar, kill eventlar va foydalanuvchi statistikasi.
import * as parser from "@laihoe/demoparser2";

export interface AnalyzedRound {
  round_number: number;
  winner: "CT" | "T" | null;
  reason: string | null;
  start_tick: number | null;
  freeze_end_tick: number | null;
  end_tick: number;
}

export interface AnalyzedKill {
  round_number: number;
  tick: number;
  seconds_into_round: number | null;
  killer_steam_id64: string | null;
  killer_name: string | null;
  killer_side: "CT" | "T" | null;
  victim_steam_id64: string | null;
  victim_name: string | null;
  victim_side: "CT" | "T" | null;
  assister_steam_id64: string | null;
  assister_name: string | null;
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  noscope: boolean;
  through_smoke: boolean;
  attacker_blind: boolean;
  is_user_kill: boolean;
  is_user_death: boolean;
}

export interface DemoAnalysis {
  mapName: string | null;
  header: Record<string, string>;
  tickrate: number;
  gameMode: string | null;
  durationSeconds: number | null;
  scoreCT: number | null;
  scoreT: number | null;
  rounds: AnalyzedRound[];
  kills: AnalyzedKill[];
  players: { steamId64: string; name: string; side: "CT" | "T" | null }[];
  user: null | {
    side: "CT" | "T" | null;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    result: "win" | "loss" | "tie" | null;
    scoreOwn: number | null;
    scoreEnemy: number | null;
  };
}

type Ev = Record<string, unknown> & { tick: number; event_name: string };

const side = (teamNum: unknown): "CT" | "T" | null => (teamNum === 3 ? "CT" : teamNum === 2 ? "T" : null);
const sid = (v: unknown): string | null => (typeof v === "string" && /^7656119\d{10}$/.test(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length ? v : null);

const GAME_MODES: Record<string, string> = { "0": "Casual", "1": "Competitive / Premier", "2": "Wingman" };

function measureTickrate(path: string | Buffer): number {
  try {
    const t = parser.parseTicks(path, ["game_time"], [2000, 6000]) as { tick: number; game_time: number }[];
    const a = t.find((x) => x.tick === 2000);
    const b = t.find((x) => x.tick === 6000);
    if (a && b && b.game_time > a.game_time) {
      const r = Math.round(4000 / (b.game_time - a.game_time));
      if (r >= 16 && r <= 256) return r;
    }
  } catch {
    /* qisqa demo — standart qiymat */
  }
  return 64;
}

export function analyzeDemo(path: string | Buffer, userSteamId64: string): DemoAnalysis {
  const header = parser.parseHeader(path) as Record<string, string>;
  if (!header?.demo_file_stamp?.startsWith("PBDEMS2")) throw new Error("CS2 demo emas");
  const tickrate = measureTickrate(path);

  const events = parser.parseEvents(path, ["round_end", "round_freeze_end", "begin_new_match", "round_announce_match_start"], [], ["total_rounds_played"]) as Ev[];
  events.sort((a, b) => a.tick - b.tick);
  const roundEnds = events.filter((e) => e.event_name === "round_end" && typeof e.winner === "string" && Number(e.round) > 0);

  // Match bir necha marta qayta boshlangan bo'lsa (warmup, restart), oxirgi haqiqiy boshlanishdan keyingisini olamiz
  const restarts = events.filter((e) => e.event_name === "begin_new_match" || e.event_name === "round_announce_match_start").map((e) => e.tick);
  const firstEnd = roundEnds[0]?.tick ?? Infinity;
  const startCandidates = restarts.filter((t) => t < firstEnd);
  let matchStartTick = startCandidates.length ? Math.max(...startCandidates) : 0;
  // keyingi restartdan keyin ham raundlar bo'lsa — o'sha qism asosiy match
  for (const t of restarts) if (t > matchStartTick && roundEnds.some((r) => r.tick > t)) matchStartTick = t;
  const realEnds = roundEnds.filter((e) => e.tick > matchStartTick);
  const freezeEnds = events.filter((e) => e.event_name === "round_freeze_end" && e.tick >= matchStartTick).map((e) => e.tick);

  const rounds: AnalyzedRound[] = [];
  let prevEnd = matchStartTick;
  realEnds.forEach((e, i) => {
    const fe = freezeEnds.filter((t) => t >= prevEnd && t < e.tick);
    rounds.push({
      round_number: i + 1,
      winner: e.winner === "CT" ? "CT" : e.winner === "T" ? "T" : null,
      reason: str(e.reason),
      start_tick: prevEnd,
      freeze_end_tick: fe.length ? fe[fe.length - 1] : null,
      end_tick: e.tick,
    });
    prevEnd = e.tick;
  });

  const roundForTick = (tick: number) => {
    const r = rounds.find((x) => tick <= x.end_tick + 5 * tickrate && tick > (x.start_tick ?? 0));
    return r ?? null;
  };

  const rawKills = parser.parseEvent(path, "player_death", ["team_num"], ["is_warmup_period"]) as Ev[];
  const kills: AnalyzedKill[] = [];
  for (const k of rawKills) {
    if (k.is_warmup_period === true || k.tick <= matchStartTick) continue;
    const round = roundForTick(k.tick);
    if (!round && rounds.length) continue; // raundlardan tashqaridagi o'limlar (masalan, match tugagach)
    const killer = sid(k.attacker_steamid);
    const victim = sid(k.user_steamid);
    const killerSide = side(k.attacker_team_num);
    const victimSide = side(k.user_team_num);
    const roundStart = round?.freeze_end_tick ?? round?.start_tick ?? null;
    kills.push({
      round_number: round?.round_number ?? 0,
      tick: k.tick,
      seconds_into_round: roundStart != null ? Math.max(0, (k.tick - roundStart) / tickrate) : null,
      killer_steam_id64: killer,
      killer_name: str(k.attacker_name),
      killer_side: killerSide,
      victim_steam_id64: victim,
      victim_name: str(k.user_name),
      victim_side: victimSide,
      assister_steam_id64: sid(k.assister_steamid),
      assister_name: str(k.assister_name),
      weapon: str(k.weapon) ?? "world",
      headshot: k.headshot === true,
      wallbang: Number(k.penetrated ?? 0) > 0,
      noscope: k.noscope === true,
      through_smoke: k.thrusmoke === true,
      attacker_blind: k.attackerblind === true,
      is_user_kill: killer === userSteamId64 && victim !== userSteamId64 && killerSide !== victimSide,
      is_user_death: victim === userSteamId64,
    });
  }

  // Yakuniy hisob va o'yinchilar (oxirgi raund tugagan tick)
  const lastTick = rounds.at(-1)?.end_tick;
  let scoreCT: number | null = null;
  let scoreT: number | null = null;
  const players: DemoAnalysis["players"] = [];
  if (lastTick) {
    const rows = parser.parseTicks(path, ["team_num", "team_rounds_total"], [lastTick]) as { steamid: string; name: string; team_num: number; team_rounds_total: number }[];
    for (const r of rows) {
      const s = side(r.team_num);
      if (s === "CT") scoreCT = r.team_rounds_total;
      if (s === "T") scoreT = r.team_rounds_total;
      if (sid(r.steamid)) players.push({ steamId64: r.steamid, name: r.name, side: s });
    }
  }
  let gameMode: string | null = null;
  try {
    const cvars = parser.parseEvent(path, "server_cvar") as Ev[];
    const modes = cvars.filter((c) => c.name === "game_mode");
    const last = modes.at(-1);
    if (last) gameMode = GAME_MODES[String(last.value)] ?? null;
  } catch {
    /* ixtiyoriy */
  }

  const me = players.find((p) => p.steamId64 === userSteamId64);
  const appearsInKills = kills.some((k) => k.killer_steam_id64 === userSteamId64 || k.victim_steam_id64 === userSteamId64);
  let user: DemoAnalysis["user"] = null;
  if (me || appearsInKills) {
    const mySide = me?.side ?? null;
    const own = mySide === "CT" ? scoreCT : mySide === "T" ? scoreT : null;
    const enemy = mySide === "CT" ? scoreT : mySide === "T" ? scoreCT : null;
    user = {
      side: mySide,
      kills: kills.filter((k) => k.is_user_kill).length,
      deaths: kills.filter((k) => k.is_user_death).length,
      // assist faqat raqibga qarshi killda hisoblanadi (teamkill emas)
      assists: kills.filter((k) => k.assister_steam_id64 === userSteamId64 && k.victim_side !== k.killer_side).length,
      headshots: kills.filter((k) => k.is_user_kill && k.headshot).length,
      scoreOwn: own,
      scoreEnemy: enemy,
      result: own == null || enemy == null ? null : own > enemy ? "win" : own < enemy ? "loss" : "tie",
    };
  }

  const firstFreeze = rounds[0]?.freeze_end_tick ?? rounds[0]?.start_tick ?? null;
  const durationSeconds = lastTick && firstFreeze != null ? Math.round((lastTick - firstFreeze) / tickrate) : null;

  return { mapName: str(header.map_name), header, tickrate, gameMode, durationSeconds, scoreCT, scoreT, rounds, kills, players, user };
}
