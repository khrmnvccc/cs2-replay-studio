import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { JobHandler } from "../queue";
import { must } from "../lib/db";
import { PermanentError } from "../lib/errors";
import { downloadUrl, uploadFile } from "../lib/storage";
import { demoObjectPath } from "../../../shared/demo-file";

// Valve replay serveridan (.dem.bz2) yuklab, storage'ga joylab, tahlilni navbatga qo'yadi.
export const downloadDemo: JobHandler = async ({ db, config, job, progress }) => {
  const match = must(await db.from("matches").select("id, user_id, demo_url, share_code").eq("id", String(job.payload.matchId ?? "")).maybeSingle(), "match");
  if (match.user_id !== job.user_id) throw new PermanentError("Ruxsat yo'q");
  if (!match.demo_url || !/^https?:\/\/replay\d+\.valve\.net\/730\/[\w.]+\.dem\.bz2$/.test(match.demo_url)) {
    throw new PermanentError("Valve demo URL topilmadi yoki noto'g'ri");
  }
  const head = await fetch(match.demo_url, { method: "HEAD" });
  if (head.status === 404) {
    await db.from("matches").update({ demo_availability: "expired" }).eq("id", match.id);
    throw new PermanentError("Valve bu demo'ni o'chirgan (replay muddati o'tgan). Demo faylni o'zingiz yuklang.");
  }
  const id = randomUUID();
  const tmp = path.join(config.WORK_DIR, "downloads", `${id}.dem.bz2`);
  await downloadUrl(match.demo_url, tmp, (d, t) => {
    if (t && Math.random() < 0.02) void progress(5 + (d / t) * 55, "Valve serveridan yuklanmoqda");
  });
  const size = fs.statSync(tmp).size;
  const objectName = demoObjectPath(job.user_id, id, "bz2");
  await progress(65, "Storage'ga yuklanmoqda");
  await uploadFile(config, "demos", objectName, tmp, "application/x-bzip2", (p) => {
    if (p % 10 === 0) void progress(65 + p * 0.3, "Storage'ga yuklanmoqda");
  });
  fs.rmSync(tmp, { force: true });
  const name = `${match.share_code ?? match.id}.dem.bz2`.replace(/[^\w\-.]/g, "_");
  must(
    await db.from("demo_files").insert({ id, user_id: job.user_id, match_id: match.id, storage_path: objectName, original_name: name, size_bytes: size, compression: "bz2", status: "uploaded" }).select("id").single(),
    "demo insert",
  );
  await db.from("processing_jobs").insert({ user_id: job.user_id, type: "parse_demo", payload: { demoFileId: id }, max_attempts: 3 });
  return { demoFileId: id, size };
};
