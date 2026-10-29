import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";
import { notify } from "../../../shared/notify";
import type { JobHandler } from "../queue";
import { downloadToFile, uploadFile } from "../lib/storage";
import { PermanentError } from "../lib/errors";

export const zipClips: JobHandler = async ({ db, config, job, progress }) => {
  const ids = (job.payload.clipIds as string[]) ?? [];
  const { data: clips, error } = await db.from("clips").select("id, user_id, title, storage_path, status").in("id", ids).eq("user_id", job.user_id).eq("status", "ready");
  if (error) throw new Error(error.message);
  if (!clips?.length) throw new PermanentError("Tayyor clip topilmadi");

  const dir = path.join(config.WORK_DIR, "zip", job.id);
  fs.mkdirSync(dir, { recursive: true });
  const used = new Set<string>();
  const files: { file: string; name: string }[] = [];
  for (const [i, c] of clips.entries()) {
    await progress(5 + (i / clips.length) * 60, `Clip yuklanmoqda ${i + 1}/${clips.length}`);
    const local = path.join(dir, `${c.id}.mp4`);
    await downloadToFile(db, "clips", c.storage_path!, local);
    let name = `${c.title.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) || "clip"}.mp4`;
    for (let n = 2; used.has(name); n++) name = name.replace(/( \(\d+\))?\.mp4$/, ` (${n}).mp4`);
    used.add(name);
    files.push({ file: local, name });
  }
  await progress(70, "ZIP arxiv yaratilmoqda");
  const zipPath = path.join(dir, "clips.zip");
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(zipPath);
    const zip = archiver("zip", { store: true }); // MP4 allaqachon siqilgan
    out.on("close", () => resolve());
    zip.on("error", reject);
    zip.pipe(out);
    for (const f of files) zip.file(f.file, { name: f.name });
    void zip.finalize();
  });
  await progress(85, "ZIP yuklanmoqda");
  const objectPath = `${job.user_id}/${job.id}.zip`;
  await uploadFile(config, "exports", objectPath, zipPath, "application/zip");
  const size = fs.statSync(zipPath).size;
  fs.rmSync(dir, { recursive: true, force: true });
  await notify(db, job.user_id, "zip_ready", { n: files.length });
  return { path: objectPath, count: files.length, size };
};
