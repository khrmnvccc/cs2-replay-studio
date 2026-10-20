// CS2 demo -> video. Bu qism faqat Windows mashinada, o'rnatilgan CS2 (Steam) va HLAE bilan ishlaydi.
// CS2'da demo'ni "server tomonida" headless render qilishning rasmiy yo'li YO'Q: o'yin klienti
// demo'ni ijro etadi, HLAE yoki startmovie kadrlarni yozadi, FFmpeg videoga aylantiradi.
//
// Backendlar:
//  - csdm:    CS Demo Manager CLI (https://cs-demo-manager.com) — `csdm analyze` + `csdm video`
//             (ichida CS2 + HLAE + FFmpeg ni boshqaradi). Tavsiya etiladi.
//  - command: o'zingizning skriptingiz. RENDER_COMMAND da {demo} {start} {end} {steamid}
//             {out} {width} {height} {fps} o'rinbosarlari; skript {out} ga video yozishi shart.
import fs from "node:fs";
import path from "node:path";
import type { Config } from "../config";
import { run } from "./proc";

export interface RenderRequest {
  demoPath: string;
  startTick: number;
  endTick: number;
  povSteamId64: string | null;
  width: number;
  height: number;
  fps: number;
  outDir: string;
}

const VIDEO_EXT = [".mp4", ".mkv", ".avi", ".mov"];

export function buildCsdmVideoArgs(r: RenderRequest): string[] {
  const args = [
    "video", r.demoPath, String(r.startTick), String(r.endTick),
    "--output", r.outDir,
    "--width", String(r.width),
    "--height", String(r.height),
    "--framerate", String(r.fps),
    "--recording-system", "HLAE",
    "--recording-output", "video",
    "--encoder-software", "FFmpeg",
    "--close-game-after-recording",
    "--no-concatenate-sequences",
    "--record-audio",
  ];
  if (r.povSteamId64) args.push("--focus-player", r.povSteamId64);
  return args;
}

export function buildCustomCommand(template: string, r: RenderRequest, outFile: string): string[] {
  const values: Record<string, string> = {
    demo: r.demoPath, start: String(r.startTick), end: String(r.endTick), steamid: r.povSteamId64 ?? "",
    out: outFile, width: String(r.width), height: String(r.height), fps: String(r.fps),
  };
  // oddiy argument bo'lish (qo'shtirnoqli bo'laklarni saqlaydi), keyin o'rinbosarlar
  const parts = template.match(/"[^"]*"|\S+/g) ?? [];
  return parts.map((p) => p.replace(/^"|"$/g, "").replace(/\{(\w+)\}/g, (_, k) => values[k] ?? `{${k}}`));
}

function newestVideo(dir: string, since: number): string | null {
  if (!fs.existsSync(dir)) return null;
  let best: { f: string; t: number } | null = null;
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (VIDEO_EXT.includes(path.extname(e.name).toLowerCase())) {
        const t = fs.statSync(p).mtimeMs;
        if (t >= since && (!best || t > best.t)) best = { f: p, t };
      }
    }
  };
  walk(dir);
  return best ? (best as { f: string }).f : null;
}

const analyzed = new Set<string>();

/** Render qiladi va hosil bo'lgan video fayl yo'lini qaytaradi (hali normalizatsiya qilinmagan). */
export async function renderClip(c: Config, r: RenderRequest, log: (msg: string) => void): Promise<string> {
  fs.mkdirSync(r.outDir, { recursive: true });
  const started = Date.now() - 1000;
  const timeoutMs = c.RENDER_TIMEOUT_MINUTES * 60_000;

  if (c.RENDER_BACKEND === "csdm") {
    if (!analyzed.has(r.demoPath)) {
      log("CS Demo Manager demo'ni tahlil qilmoqda");
      const a = await run(c.CSDM_PATH, ["analyze", r.demoPath], { timeoutMs });
      if (a.code !== 0) throw new Error(`csdm analyze xatosi (${a.code}): ${(a.stderr || a.stdout).slice(-600)}`);
      analyzed.add(r.demoPath);
    }
    log("CS2 + HLAE orqali yozib olinmoqda");
    const v = await run(c.CSDM_PATH, buildCsdmVideoArgs(r), { timeoutMs, onLine: (l) => console.log(`[csdm] ${l}`) });
    if (v.code !== 0) throw new Error(`csdm video xatosi (${v.code}): ${(v.stderr || v.stdout).slice(-600)}`);
  } else if (c.RENDER_BACKEND === "command") {
    const out = path.join(r.outDir, "render.mp4");
    const [cmd, ...args] = buildCustomCommand(c.RENDER_COMMAND!, r, out);
    log("Render skripti ishga tushirildi");
    const v = await run(cmd, args, { timeoutMs, onLine: (l) => console.log(`[render] ${l}`) });
    if (v.code !== 0) throw new Error(`Render skripti xatosi (${v.code}): ${(v.stderr || v.stdout).slice(-600)}`);
  } else {
    throw new Error("RENDER_BACKEND sozlanmagan");
  }
  const video = newestVideo(r.outDir, started);
  if (!video) throw new Error("Render tugadi, lekin video fayl topilmadi. CS2/HLAE loglarini tekshiring.");
  return video;
}
