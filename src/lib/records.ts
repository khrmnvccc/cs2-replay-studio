import type { MatchRow } from "@/lib/types";

export type KillLite = { match_id: string; round_number: number; tick: number; is_user_kill: boolean; headshot: boolean };
export interface RecordItem {
  id: string;
  label: string;
  value: string | null;
  match: MatchRow | null;
}

/** Bir matchdan eng yaxshi qiymat; teng bo'lsa — eskirog'i (rekord birinchi o'rnatilgan payt). */
function best(matches: MatchRow[], score: (m: MatchRow) => number | null): [MatchRow | null, number | null] {
  let top: MatchRow | null = null;
  let val: number | null = null;
  for (const m of matches) {
    const v = score(m);
    if (v == null || !Number.isFinite(v)) continue;
    if (val == null || v > val) {
      top = m;
      val = v;
    }
  }
  return [top, val];
}

/**
 * Shaxsiy rekordlar: matchlar statistikasi (GC yoki demo) va demo kill eventlaridan.
 * ADR, reyting va utility zarar kabi ko'rsatkichlar uchun zarar ma'lumoti kerak — hozircha yo'q.
 */
export function buildRecords(matches: MatchRow[], kills: KillLite[]): RecordItem[] {
  const ordered = [...matches].sort((a, b) => (a.played_at ?? a.created_at).localeCompare(b.played_at ?? b.created_at));
  const byId = new Map(ordered.map((m) => [m.id, m]));

  // Demo eventlaridan: birinchi o'ldirishlar va bir raunddagi eng ko'p kill
  const rounds = new Map<string, KillLite[]>();
  for (const k of kills) {
    const key = `${k.match_id}:${k.round_number}`;
    const arr = rounds.get(key);
    if (arr) arr.push(k);
    else rounds.set(key, [k]);
  }
  const firstKills = new Map<string, number>();
  const roundMax = new Map<string, number>();
  for (const [key, list] of rounds) {
    const matchId = key.split(":")[0];
    const first = list.reduce((a, b) => (b.tick < a.tick ? b : a));
    if (first.is_user_kill) firstKills.set(matchId, (firstKills.get(matchId) ?? 0) + 1);
    const mine = list.filter((k) => k.is_user_kill).length;
    roundMax.set(matchId, Math.max(roundMax.get(matchId) ?? 0, mine));
  }

  const item = (id: string, label: string, [m, v]: [MatchRow | null, number | null], fmt: (v: number) => string = String): RecordItem => ({
    id,
    label,
    value: v == null ? null : fmt(v),
    match: m,
  });
  const fromMap = (map: Map<string, number>) => (m: MatchRow) => (map.has(m.id) ? map.get(m.id)! : null);
  const withStats = ordered.filter((m) => m.kills != null);
  const decided = ordered.filter((m) => m.score_own != null && m.score_enemy != null);

  return [
    item("kills", "Eng ko'p o'ldirish", best(withStats, (m) => m.kills)),
    item("hs", "Eng ko'p HS", best(withStats, (m) => m.headshots)),
    item("hsp", "Eng yuqori HS%", best(withStats.filter((m) => (m.kills ?? 0) >= 10), (m) => (m.headshots != null && m.kills ? (m.headshots / m.kills) * 100 : null)), (v) => `${Math.round(v)}%`),
    item("kd", "Eng yaxshi K/D", best(withStats.filter((m) => (m.kills ?? 0) >= 5), (m) => (m.kills! / Math.max(1, m.deaths ?? 0))), (v) => v.toFixed(2)),
    item("assists", "Eng ko'p assist", best(withStats, (m) => m.assists)),
    item("entry", "Eng ko'p birinchi o'ldirish", best(ordered.filter((m) => byId.has(m.id)), fromMap(firstKills))),
    item("round", "Bir raundda eng ko'p kill", best(ordered, fromMap(roundMax))),
    item("margin", "Eng katta g'alaba", best(decided.filter((m) => m.score_own! > m.score_enemy!), (m) => m.score_own! - m.score_enemy!), (v) => `+${v}`),
    item("fewest", "Eng kam o'lim", best(withStats.filter((m) => m.deaths != null && (m.kills ?? 0) > 0), (m) => -(m.deaths ?? 0)), (v) => String(-v)),
    item("long", "Eng uzun o'yin", best(ordered, (m) => m.duration_seconds), (v) => `${Math.floor(v / 60)}m ${String(Math.round(v % 60)).padStart(2, "0")}s`),
  ];
}
