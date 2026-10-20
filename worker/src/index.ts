import { loadConfig } from "./config";
import { serviceDb } from "./lib/db";
import { Queue } from "./queue";
import { parseDemo, parseDemoFailed } from "./jobs/parse-demo";
import { syncMatches, syncMatchesFailed } from "./jobs/sync-matches";
import { fetchMatchInfo } from "./jobs/fetch-match-info";
import { downloadDemo } from "./jobs/download-demo";
import { renderClipJob, renderClipFailed } from "./jobs/render-clip";
import { zipClips } from "./jobs/zip-clips";
import { maintenance } from "./maintenance";

async function main() {
  const config = loadConfig();
  const db = serviceDb(config);
  const queue = new Queue(
    db,
    config,
    {
      parse_demo: parseDemo,
      sync_matches: syncMatches,
      fetch_match_info: fetchMatchInfo,
      download_demo: downloadDemo,
      render_clip: renderClipJob,
      zip_clips: zipClips,
    },
    { parse_demo: parseDemoFailed, sync_matches: syncMatchesFailed, render_clip: renderClipFailed },
  );
  const types = queue.types;
  console.log(`[worker] ${config.WORKER_ID} ishga tushdi. Qobiliyatlar: ${[...config.capabilities].join(", ")}. Ishlar: ${types.join(", ")}`);
  await queue.heartbeat();
  setInterval(() => void queue.heartbeat().catch((e) => console.error("[heartbeat]", e.message)), 30_000);
  setInterval(() => void maintenance(db).catch((e) => console.error("[maintenance]", e.message)), 3600_000);
  void maintenance(db).catch((e) => console.error("[maintenance]", e.message));

  // Render (CS2 o'yini) bir vaqtda faqat bitta ishlashi mumkin — alohida slot
  const renderTypes = types.filter((t) => t === "render_clip");
  const otherTypes = types.filter((t) => t !== "render_clip");
  const loops: Promise<void>[] = [];
  if (renderTypes.length) loops.push(queue.runLoop(0, renderTypes));
  if (otherTypes.length) for (let i = 1; i <= config.WORKER_CONCURRENCY; i++) loops.push(queue.runLoop(i, otherTypes));

  const shutdown = () => {
    console.log("[worker] to'xtatilmoqda — joriy ishlar tugashi kutiladi");
    queue.stop();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await Promise.all(loops);
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
