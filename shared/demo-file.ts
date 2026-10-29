// Demo faylini tekshirish: kengaytma, hajm va magic baytlar.
// CS2 demo: "PBDEMS2\0". Valve replay serveridan kelgan demo: bzip2 ("BZh").
export const DEMO_MAX_BYTES_DEFAULT = 1024 * 1024 * 1024; // 1 GiB
export const DEMO_MIN_BYTES = 64 * 1024;
const ALLOWED_EXT = [".dem", ".dem.bz2"] as const;

export type DemoCompression = "none" | "bz2";

export interface DemoNameCheck {
  ok: boolean;
  compression?: DemoCompression;
  error?: string;
}

export function checkDemoName(name: string, size: number, maxBytes = DEMO_MAX_BYTES_DEFAULT): DemoNameCheck {
  const lower = name.toLowerCase();
  const ext = ALLOWED_EXT.find((e) => lower.endsWith(e));
  if (!ext) return { ok: false, error: "Faqat .dem yoki .dem.bz2 fayllar qabul qilinadi" };
  if (!/^[\w\-. ()[\]]{1,200}$/.test(name)) return { ok: false, error: "Fayl nomida ruxsat etilmagan belgilar bor" };
  if (!Number.isFinite(size) || size < DEMO_MIN_BYTES) return { ok: false, error: "Fayl juda kichik — bu CS2 demo emas" };
  if (size > maxBytes) return { ok: false, error: `Fayl juda katta (maksimal ${Math.round(maxBytes / 1024 / 1024)} MB)` };
  return { ok: true, compression: ext === ".dem.bz2" ? "bz2" : "none" };
}

export function detectDemoMagic(head: Uint8Array): DemoCompression | "csgo" | null {
  const s = String.fromCharCode(...head.slice(0, 8));
  if (s === "PBDEMS2\0") return "none";
  if (s.startsWith("HL2DEMO")) return "csgo"; // CS:GO (Source 1) demo — qo'llab-quvvatlanmaydi
  if (s.startsWith("BZh")) return "bz2";
  return null;
}

/** Storage'dagi xavfsiz obyekt nomi: <userId>/<demoId>.dem[.bz2] */
export function demoObjectPath(userId: string, demoId: string, compression: DemoCompression): string {
  return `${userId}/${demoId}.dem${compression === "bz2" ? ".bz2" : ""}`;
}

/** Valve replay serveridagi demo havolasi (GC beradi). */
export const VALVE_DEMO_URL_RE = /^https?:\/\/replay\d+\.valve\.net\/730\/[\w.]+\.dem\.bz2$/;

/** Storage limitidan katta Valve demolari storage'ga yuklanmaydi: storage_path o'rnida Valve havolasi saqlanadi. */
// Format: <valve url>#<demoId> (fragment storage_path'ni unikal qiladi)
export function isExternalDemoPath(storagePath: string): boolean {
  return VALVE_DEMO_URL_RE.test(storagePath.split("#")[0]);
}

export function externalDemoUrl(storagePath: string): string {
  return storagePath.split("#")[0];
}
