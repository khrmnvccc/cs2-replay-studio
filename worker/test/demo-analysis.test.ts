import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { analyzeDemo } from "../src/lib/demo-analysis";

// Haqiqiy CS2 demo bilan test: DEMO_FIXTURE=/path/to/match.dem npm test
// (masalan, Hugging Face'dagi ochiq "aldigobbler/cs2demos" to'plamidan
//  2game-vs-selva-m2-anubis-p2.dem — 76 MB)
const fixture = process.env.DEMO_FIXTURE;

describe.skipIf(!fixture || !fs.existsSync(fixture))("analyzeDemo (haqiqiy demo)", () => {
  const POV = "76561198922682627"; // shu demodagi o'yinchi
  const a = analyzeDemo(fixture!, POV);

  it("header va tickrate", () => {
    expect(a.mapName).toMatch(/^de_/);
    expect(a.tickrate).toBe(64);
  });
  it("raundlar ketma-ket va g'olibi bor", () => {
    expect(a.rounds.length).toBeGreaterThan(0);
    a.rounds.forEach((r, i) => {
      expect(r.round_number).toBe(i + 1);
      expect(["CT", "T"]).toContain(r.winner);
      expect(r.end_tick).toBeGreaterThan(r.start_tick ?? 0);
    });
  });
  it("killlar raundga bog'langan va tartiblangan", () => {
    expect(a.kills.length).toBeGreaterThan(0);
    for (const k of a.kills) {
      expect(k.round_number).toBeGreaterThan(0);
      expect(k.weapon.length).toBeGreaterThan(0);
      expect(k.seconds_into_round ?? 0).toBeGreaterThanOrEqual(0);
    }
  });
  it("foydalanuvchi statistikasi kill eventlarga mos", () => {
    expect(a.user).not.toBeNull();
    expect(a.user!.kills).toBe(a.kills.filter((k) => k.killer_steam_id64 === POV && k.killer_side !== k.victim_side).length);
    expect(a.user!.headshots).toBeLessThanOrEqual(a.user!.kills);
    expect(a.scoreCT! + a.scoreT!).toBe(a.rounds.length);
  });
  it("demoda bo'lmagan foydalanuvchi uchun user=null", () => {
    expect(analyzeDemo(fixture!, "76561190000000000").user).toBeNull();
  });
});

describe("analyzeDemo xatolar", () => {
  it("CS2 bo'lmagan faylni rad etadi", () => {
    expect(() => analyzeDemo(Buffer.from("not a demo at all, just text".repeat(100)), "76561198000000001")).toThrow();
  });
});
