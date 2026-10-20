import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

export function formatDuration(sec: number | null | undefined): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m >= 60 ? `${Math.floor(m / 60)} soat ${m % 60} daq` : `${m}:${String(s).padStart(2, "0")}`;
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
export function formatDate(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return withTime ? `${date}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : date;
}

export function kd(k: number | null, d: number | null): string {
  if (k == null || d == null) return "—";
  return d === 0 ? k.toFixed(2) : (k / d).toFixed(2);
}

export const WEAPON_NAMES: Record<string, string> = {
  ak47: "AK-47", m4a1: "M4A4", m4a1_silencer: "M4A1-S", awp: "AWP", deagle: "Desert Eagle", usp_silencer: "USP-S",
  glock: "Glock-18", hkp2000: "P2000", p250: "P250", elite: "Dual Berettas", fiveseven: "Five-SeveN", tec9: "Tec-9",
  cz75a: "CZ75-Auto", revolver: "R8", galilar: "Galil AR", famas: "FAMAS", sg556: "SG 553", aug: "AUG", ssg08: "SSG 08",
  mac10: "MAC-10", mp9: "MP9", mp7: "MP7", mp5sd: "MP5-SD", ump45: "UMP-45", p90: "P90", bizon: "PP-Bizon",
  nova: "Nova", xm1014: "XM1014", mag7: "MAG-7", sawedoff: "Sawed-Off", m249: "M249", negev: "Negev",
  hegrenade: "HE Grenade", inferno: "Molotov", molotov: "Molotov", incgrenade: "Incendiary", knife: "Knife", taser: "Zeus x27",
  world: "World", planted_c4: "C4",
};
export function weaponName(w: string): string {
  if (w.startsWith("knife") || w === "bayonet") return "Knife";
  return WEAPON_NAMES[w] ?? w;
}
