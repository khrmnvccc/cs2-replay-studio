import fs from "node:fs";
import path from "node:path";
import { notify } from "../../../shared/notify";
import type { FailureHook, JobHandler } from "../queue";
import { must } from "../lib/db";
import { PermanentError } from "../lib/errors";
import { ensureLocalDemo, pruneDemoCache } from "../lib/demo-cache";
import { renderClip } from "../lib/render";
import { makeThumbnail, normalizeToMp4, probeDuration } from "../lib/ffmpeg";
import { uploadFile } from "../lib/storage";

export const renderClipJob: JobHandler = async ({ db, config, job, progress }) => {
  const clip = must(await db.from("clips").select("*").eq("id", String(job.payload.clipId ?? "")).maybeSingle(), "clip");
  if (clip.user_id !== job.user_id) throw new PermanentError("Ruxsat yo'q");
  const demo = must(await db.from("demo_files").select("id, storage_path, compression, status").eq("id", clip.demo_file_id).maybeSingle(), "demo");
  if (demo.status === "expired") throw new PermanentError("Demo fayli saqlash muddati tugagani uchun o'chirilgan");

  await db.from("clips").update({ status: "rendering", error: null }).eq("id", clip.id);
  await progress(5, "Demo tayyorlanmoqda");
  const demoPath = await ensureLocalDemo(db, config, demo);
  pruneDemoCache(config);

  const [width, height] = String(clip.resolution).split("x").map(Number);
  const outDir = path.join(config.WORK_DIR, "renders", clip.id);
  fs.rmSync(outDir, { recursive: true, force: true });
  await progress(15, "CS2 ishga tushirilmoqda");
  const raw = await renderClip(
    config,
    { demoPath, startTick: clip.start_tick, endTick: clip.end_tick, povSteamId64: clip.pov_steam_id64, width, height, fps: clip.fps, outDir },
    (m) => void progress(40, m),
  );

  await progress(75, "MP4 ga kodlanmoqda (FFmpeg)");
  const mp4 = path.join(outDir, "final.mp4");
  const thumb = path.join(outDir, "thumb.jpg");
  await normalizeToMp4(config, raw, mp4, { width, height, fps: clip.fps });
  const duration = await probeDuration(config, mp4);
  await makeThumbnail(config, mp4, thumb, Math.min(1.5, duration / 2));

  await progress(88, "Yuklanmoqda");
  const videoPath = `${job.user_id}/${clip.id}.mp4`;
  const thumbPath = `${job.user_id}/${clip.id}.jpg`;
  await uploadFile(config, "clips", videoPath, mp4, "video/mp4");
  await uploadFile(config, "clips", thumbPath, thumb, "image/jpeg");
  const size = fs.statSync(mp4).size;
  await db
    .from("clips")
    .update({ status: "ready", storage_path: videoPath, thumbnail_path: thumbPath, size_bytes: size, duration_seconds: duration, error: null })
    .eq("id", clip.id);
  fs.rmSync(outDir, { recursive: true, force: true });
  const { data: signed } = await db.storage.from("clips").createSignedUrl(videoPath, 3600);
  await notify(db, job.user_id, "clip_ready", { title: clip.title }, { videoUrl: signed?.signedUrl ?? null });
  return { clipId: clip.id, size, duration };
};

export const renderClipFailed: FailureHook = async ({ db, job }, error) => {
  await db.from("clips").update({ status: "failed", error }).eq("id", String(job.payload.clipId ?? ""));
};
