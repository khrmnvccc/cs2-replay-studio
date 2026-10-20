import type { Config } from "../config";
import { run } from "./proc";

/** Render natijasini veb uchun mos MP4 (H.264 + AAC, faststart) ga keltirish. */
export async function normalizeToMp4(c: Config, input: string, output: string, opts: { width: number; height: number; fps: number }) {
  const r = await run(c.FFMPEG_PATH, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-i", input,
    "-vf", `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease,pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2,fps=${opts.fps}`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart",
    output,
  ], { timeoutMs: 15 * 60_000 });
  if (r.code !== 0) throw new Error(`FFmpeg xatosi: ${r.stderr.slice(-500)}`);
}

export async function makeThumbnail(c: Config, input: string, output: string, atSeconds: number) {
  const r = await run(c.FFMPEG_PATH, ["-y", "-hide_banner", "-loglevel", "error", "-ss", String(atSeconds), "-i", input, "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "4", output]);
  if (r.code !== 0) throw new Error(`Thumbnail xatosi: ${r.stderr.slice(-300)}`);
}

export async function probeDuration(c: Config, input: string): Promise<number> {
  const r = await run(c.FFPROBE_PATH, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", input]);
  const d = Number(r.stdout.trim());
  if (r.code !== 0 || !Number.isFinite(d)) throw new Error("ffprobe davomiylikni aniqlay olmadi");
  return d;
}
