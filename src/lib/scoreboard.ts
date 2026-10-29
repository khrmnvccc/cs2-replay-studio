import type { KillEventRow, RoundRow } from "@/lib/types";

export type Side = "CT" | "T";
export interface ScoreRow {
  key: string;
  steamId: string | null;
  name: string;
  team: "A" | "B";
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  isUser: boolean;
}

const HALF = 12; // MR12: 12-raunddan keyin tomonlar almashadi
const flip = (s: Side): Side => (s === "CT" ? "T" : "CT");
const asSide = (s: string | null): Side | null => (s === "CT" || s === "T" ? s : null);

/** Shu raunddagi tomondan o'yinchining boshlang'ich (1-yarim) tomonini topadi. Qo'shimcha vaqt hisobga olinmaydi. */
export function startSide(side: Side, round: number): Side | null {
  if (round <= HALF) return side;
  if (round <= HALF * 2) return flip(side);
  return null;
}

/** Foydalanuvchi shu raundda qaysi tomonda o'ynagan (boshlang'ich tomondan). */
export function sideInRound(start: Side, round: number): Side {
  return round > HALF && round <= HALF * 2 ? flip(start) : start;
}

/**
 * Kill eventlardan 10 o'yinchilik hisob jadvali. Jamoa — boshlang'ich tomon bo'yicha;
 * "A" — foydalanuvchining jamoasi (u demoda bo'lmasa — CT'dan boshlagan jamoa).
 * Teamkill kill hisoblanmaydi, o'lim esa hisoblanadi.
 */
export function buildScoreboard(kills: KillEventRow[], userSteamId: string): { rows: ScoreRow[]; userStart: Side | null } {
  const players = new Map<string, ScoreRow & { votes: Record<Side, number> }>();
  const get = (id: string | null, name: string | null) => {
    const key = id || `name:${name ?? "?"}`;
    let p = players.get(key);
    if (!p) {
      p = { key, steamId: id, name: name || "?", team: "A", kills: 0, deaths: 0, assists: 0, headshots: 0, isUser: id === userSteamId, votes: { CT: 0, T: 0 } };
      players.set(key, p);
    }
    if (name) p.name = name;
    return p;
  };
  const vote = (p: { votes: Record<Side, number> }, side: string | null, round: number) => {
    const s = asSide(side);
    const st = s && startSide(s, round);
    if (st) p.votes[st]++;
  };

  for (const k of kills) {
    const victim = k.victim_steam_id64 || k.victim_name ? get(k.victim_steam_id64, k.victim_name) : null;
    if (victim) {
      victim.deaths++;
      vote(victim, k.victim_side, k.round_number);
    }
    if (k.killer_steam_id64 || k.killer_name) {
      const killer = get(k.killer_steam_id64, k.killer_name);
      vote(killer, k.killer_side, k.round_number);
      const teamkill = asSide(k.killer_side) && k.killer_side === k.victim_side;
      if (killer !== victim && !teamkill) {
        killer.kills++;
        if (k.headshot) killer.headshots++;
      }
    }
    if (k.assister_steam_id64 || k.assister_name) get(k.assister_steam_id64 ?? null, k.assister_name).assists++;
  }

  const start = (p: { votes: Record<Side, number> }): Side => (p.votes.T > p.votes.CT ? "T" : "CT");
  const me = [...players.values()].find((p) => p.isUser);
  const userStart = me ? start(me) : null;
  const teamA = userStart ?? "CT";
  const rows = [...players.values()].map(({ votes, ...p }) => ({ ...p, team: start({ votes }) === teamA ? ("A" as const) : ("B" as const) }));
  rows.sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  return { rows, userStart };
}

export function roundCount(rounds: RoundRow[], scoreA: number | null, scoreB: number | null): number {
  return rounds.length || (scoreA ?? 0) + (scoreB ?? 0);
}
