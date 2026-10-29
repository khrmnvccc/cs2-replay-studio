import { describe, expect, it } from "vitest";
import { buildScoreboard } from "@/lib/scoreboard";
import type { KillEventRow } from "@/lib/types";

const k = (round: number, killer: [string, string] | null, victim: [string, string], extra: Partial<KillEventRow> = {}): KillEventRow => ({
  id: Math.random().toString(),
  match_id: "m",
  demo_file_id: "d",
  round_number: round,
  tick: round * 1000,
  seconds_into_round: 10,
  killer_steam_id64: killer?.[0] ?? null,
  killer_name: killer?.[0] ?? null,
  killer_side: killer?.[1] ?? null,
  victim_steam_id64: victim[0],
  victim_name: victim[0],
  victim_side: victim[1],
  assister_name: null,
  weapon: "ak47",
  headshot: false,
  wallbang: false,
  noscope: false,
  through_smoke: false,
  attacker_blind: false,
  is_user_kill: false,
  is_user_death: false,
  ...extra,
});

describe("buildScoreboard", () => {
  it("groups players by starting side across halftime and puts the user's team first", () => {
    const kills = [
      k(1, ["me", "T"], ["bob", "CT"], { headshot: true }),
      k(2, ["bob", "CT"], ["mate", "T"]),
      // ikkinchi yarim: tomonlar almashgan
      k(13, ["me", "CT"], ["bob", "T"]),
      k(14, ["mate", "CT"], ["me", "CT"]), // teamkill: kill hisoblanmaydi
    ];
    const { rows, userStart } = buildScoreboard(kills, "me");
    expect(userStart).toBe("T");
    const by = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(by.me).toMatchObject({ team: "A", kills: 2, deaths: 1, headshots: 1, isUser: true });
    expect(by.mate).toMatchObject({ team: "A", kills: 0 });
    expect(by.bob).toMatchObject({ team: "B", kills: 1, deaths: 2 });
  });
});
