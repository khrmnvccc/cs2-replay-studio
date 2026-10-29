import { describe, expect, it } from "vitest";
import { buildRecords } from "@/lib/records";
import type { MatchRow } from "@/lib/types";

const m = (id: string, p: Partial<MatchRow>): MatchRow => ({ id, created_at: `2026-10-1${id}T10:00:00Z`, played_at: null, kills: null, deaths: null, assists: null, headshots: null, score_own: null, score_enemy: null, duration_seconds: null, ...p }) as MatchRow;

describe("buildRecords", () => {
  it("picks the best match per record and computes round-based records from kills", () => {
    const matches = [m("1", { kills: 8, deaths: 14, assists: 5, headshots: 3, score_own: 13, score_enemy: 5 }), m("2", { kills: 6, deaths: 5, assists: 1, headshots: 1, score_own: 13, score_enemy: 1 })];
    const kills = [
      { match_id: "2", round_number: 1, tick: 10, is_user_kill: true, headshot: false },
      { match_id: "2", round_number: 1, tick: 20, is_user_kill: true, headshot: false },
      { match_id: "1", round_number: 1, tick: 5, is_user_kill: false, headshot: false },
    ];
    const r = Object.fromEntries(buildRecords(matches, kills).map((x) => [x.id, x]));
    expect(r.kills).toMatchObject({ value: "8", match: { id: "1" } });
    expect(r.kd).toMatchObject({ value: "1.20", match: { id: "2" } });
    expect(r.entry).toMatchObject({ value: "1", match: { id: "2" } });
    expect(r.round).toMatchObject({ value: "2", match: { id: "2" } });
    expect(r.margin).toMatchObject({ value: "+12", match: { id: "2" } });
    expect(r.hsp.value).toBeNull();
  });
});
