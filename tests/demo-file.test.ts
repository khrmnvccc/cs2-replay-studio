import { describe, expect, it } from "vitest";
import { checkDemoName, demoObjectPath, detectDemoMagic } from "@shared/demo-file";
import { clipWindow, formatTickTime } from "@shared/clip";

const MB = 1024 * 1024;
const enc = (s: string) => new TextEncoder().encode(s);

describe("demo fayl tekshiruvi", () => {
  it("kengaytma va hajm", () => {
    expect(checkDemoName("match.dem", 100 * MB)).toEqual({ ok: true, compression: "none" });
    expect(checkDemoName("003.dem.bz2", 50 * MB)).toEqual({ ok: true, compression: "bz2" });
    expect(checkDemoName("virus.exe", 10 * MB).ok).toBe(false);
    expect(checkDemoName("match.dem.exe", 10 * MB).ok).toBe(false);
    expect(checkDemoName("tiny.dem", 100).ok).toBe(false);
    expect(checkDemoName("big.dem", 2000 * MB, 1024 * MB).ok).toBe(false);
    expect(checkDemoName("../../etc/passwd.dem", 10 * MB).ok).toBe(false);
  });
  it("magic baytlar", () => {
    expect(detectDemoMagic(enc("PBDEMS2\0xxxx"))).toBe("none");
    expect(detectDemoMagic(enc("BZh91AY&SY"))).toBe("bz2");
    expect(detectDemoMagic(enc("HL2DEMO\0"))).toBe("csgo");
    expect(detectDemoMagic(enc("MZ\x90\0\x03\0\0\0"))).toBe(null);
  });
  it("storage yo'li foydalanuvchi papkasida", () => {
    expect(demoObjectPath("u1", "d1", "bz2")).toBe("u1/d1.dem.bz2");
  });
});

describe("clip oynasi", () => {
  it("oldin/keyin soniyalar tick'ga aylanadi", () => {
    expect(clipWindow({ killTick: 6400, preSeconds: 4, postSeconds: 2 })).toEqual({ startTick: 6144, endTick: 6528, durationSeconds: 6 });
  });
  it("raund boshidan oldinga chiqmaydi", () => {
    const w = clipWindow({ killTick: 1300, preSeconds: 5, postSeconds: 2, roundStartTick: 1231 });
    expect(w.startTick).toBe(1231);
  });
  it("chegaradan tashqari qiymatlar cheklanadi", () => {
    const w = clipWindow({ killTick: 100, preSeconds: 999, postSeconds: -5 });
    expect(w.startTick).toBe(1);
    expect(w.endTick).toBeGreaterThan(w.startTick);
  });
  it("vaqt formati", () => {
    expect(formatTickTime(64 * 75)).toBe("1:15");
  });
});
