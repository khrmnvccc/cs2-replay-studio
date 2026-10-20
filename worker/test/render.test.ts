import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCsdmVideoArgs, buildCustomCommand } from "../src/lib/render";
import { makeThumbnail, normalizeToMp4, probeDuration } from "../src/lib/ffmpeg";
import { run } from "../src/lib/proc";
import type { Config } from "../src/config";

const req = { demoPath: "C:\\demos\\a b.dem", startTick: 1000, endTick: 1400, povSteamId64: "76561198000000001", width: 1920, height: 1080, fps: 60, outDir: "C:\\out" };

describe("render buyruqlari", () => {
  it("csdm video argumentlari", () => {
    const a = buildCsdmVideoArgs(req);
    expect(a.slice(0, 4)).toEqual(["video", "C:\\demos\\a b.dem", "1000", "1400"]);
    expect(a).toContain("--focus-player");
    expect(a[a.indexOf("--recording-system") + 1]).toBe("HLAE");
  });
  it("custom command o'rinbosarlari (shell'siz, bo'shliqli yo'llar saqlanadi)", () => {
    const parts = buildCustomCommand('"C:\\tools\\render.exe" --demo {demo} --from {start} --to {end} --pov {steamid} -o {out}', req, "C:\\out\\render.mp4");
    expect(parts[0]).toBe("C:\\tools\\render.exe");
    expect(parts).toContain("C:\\demos\\a b.dem");
    expect(parts).toContain("76561198000000001");
    expect(parts.at(-1)).toBe("C:\\out\\render.mp4");
  });
});

// FFmpeg post-processing (render natijasini veb MP4 ga keltirish) — haqiqiy ffmpeg bilan
const hasFfmpeg = (() => {
  try {
    return require("node:child_process").spawnSync("ffmpeg", ["-version"]).status === 0;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasFfmpeg)("ffmpeg normalizatsiya", () => {
  it("har qanday kirishni H.264 MP4 + thumbnail ga aylantiradi", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rs-ff-"));
    const input = path.join(dir, "raw.avi");
    // test kirishi: ffmpeg'ning sintetik test signali (render chiqishi o'rnida)
    await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=800x600:rate=30:duration=2", "-f", "lavfi", "-i", "sine=duration=2", "-shortest", "-c:v", "mjpeg", input]);
    const c = { FFMPEG_PATH: "ffmpeg", FFPROBE_PATH: "ffprobe" } as Config;
    const out = path.join(dir, "final.mp4");
    await normalizeToMp4(c, input, out, { width: 1280, height: 720, fps: 60 });
    const d = await probeDuration(c, out);
    expect(d).toBeGreaterThan(1.5);
    const probe = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,pix_fmt", "-of", "csv=p=0", out]);
    expect(probe.stdout.trim()).toBe("h264,1280,720,yuv420p");
    await makeThumbnail(c, out, path.join(dir, "t.jpg"), 1);
    expect(fs.statSync(path.join(dir, "t.jpg")).size).toBeGreaterThan(1000);
    fs.rmSync(dir, { recursive: true, force: true });
  }, 60_000);
});
