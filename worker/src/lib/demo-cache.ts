import fs from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../config";
import { downloadToFile } from "./storage";
import { pipeline } from "node:stream/promises";
import bz2 from "unbzip2-stream";
import { PermanentError } from "./errors";

interface DemoRow {
  id: string;
  storage_path: string;
  compression: "none" | "bz2";
}

/** Demo'ni lokal keshga yuklaydi (bz2 bo'lsa ochadi) va .dem yo'lini qaytaradi. */
export async function ensureLocalDemo(db: SupabaseClient, c: Config, demo: DemoRow, onProgress?: (pct: number) => Promise<void> | void): Promise<string> {
  const dir = path.join(c.WORK_DIR, "demos");
  fs.mkdirSync(dir, { recursive: true });
  const dem = path.join(dir, `${demo.id}.dem`);
  if (fs.existsSync(dem)) return dem;
  const raw = demo.compression === "bz2" ? `${dem}.bz2` : dem;
  await downloadToFile(db, "demos", demo.storage_path, raw);
  await onProgress?.(80);
  if (demo.compression === "bz2") {
    // Sof JS bzip2 dekompressiya (Windows render worker'da ham ishlaydi)
    try {
      await pipeline(fs.createReadStream(raw), bz2(), fs.createWriteStream(`${dem}.part`));
      fs.renameSync(`${dem}.part`, dem);
    } catch (e) {
      fs.rmSync(`${dem}.part`, { force: true });
      throw new PermanentError(`bz2 ochilmadi: ${(e as Error).message}`);
    } finally {
      fs.rmSync(raw, { force: true });
    }
  }
  await onProgress?.(100);
  return dem;
}

/** Kesh hajmini cheklash: eng eski fayllarni o'chiradi */
export function pruneDemoCache(c: Config, maxFiles = 20) {
  const dir = path.join(c.WORK_DIR, "demos");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  for (const { f } of files.slice(maxFiles)) fs.rmSync(path.join(dir, f), { force: true });
}
