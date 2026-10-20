import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { Upload } from "tus-js-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../config";

export async function downloadToFile(db: SupabaseClient, bucket: string, objectPath: string, dest: string) {
  const { data, error } = await db.storage.from(bucket).createSignedUrl(objectPath, 3600);
  if (error || !data) throw new Error(`Storage fayli topilmadi: ${bucket}/${objectPath}`);
  await downloadUrl(data.signedUrl, dest);
}

export async function downloadUrl(url: string, dest: string, onProgress?: (done: number, total: number) => void) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Yuklab olishda xato: HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length") ?? 0);
  let done = 0;
  const body = Readable.fromWeb(res.body as never);
  if (onProgress) body.on("data", (chunk: Buffer) => onProgress((done += chunk.length), total));
  await pipeline(body, fs.createWriteStream(dest + ".part"));
  fs.renameSync(dest + ".part", dest);
}

/** Katta fayllar uchun TUS resumable upload (6 MB bo'laklar). */
export async function uploadFile(c: Config, bucket: string, objectPath: string, filePath: string, contentType: string, onProgress?: (pct: number) => void) {
  const size = fs.statSync(filePath).size;
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(fs.createReadStream(filePath), {
      endpoint: `${c.SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${c.SUPABASE_SERVICE_ROLE_KEY}`, apikey: c.SUPABASE_SERVICE_ROLE_KEY, "x-upsert": "true" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      uploadSize: size,
      metadata: { bucketName: bucket, objectName: objectPath, contentType, cacheControl: "3600" },
      onError: reject,
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}
