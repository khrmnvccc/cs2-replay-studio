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

type Lang = "uz" | "ru";

export function formatDuration(sec: number | null | undefined, lang: Lang = "uz"): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m >= 60) return lang === "ru" ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${Math.floor(m / 60)} soat ${m % 60} daq`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Sanalar Toshkent vaqtida (server UTC'da ishlaydi, foydalanuvchilar asosan O'zbekistonda).
const TZ = "Asia/Tashkent";
const MONTHS: Record<Lang, string[]> = {
  uz: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"],
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
};
const MONTHS_LONG: Record<Lang, string[]> = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};
const WEEKDAYS: Record<Lang, string[]> = {
  uz: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"],
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
};

function parts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { y: p.year, m: Number(p.month) - 1, d: Number(p.day), hh: p.hour, mm: p.minute, wd };
}

export function formatDate(iso: string | null | undefined, withTime = true, lang: Lang = "uz"): string {
  if (!iso) return "—";
  const p = parts(new Date(iso));
  const date = `${p.d} ${MONTHS[lang][p.m]} ${p.y}`;
  return withTime ? `${date}, ${p.hh}:${p.mm}` : date;
}

/** "Payshanba, 29-oktabr, 2026" / "Четверг, 29 октября 2026" */
export function formatLongDate(d: Date, lang: Lang = "uz"): string {
  const p = parts(d);
  return lang === "ru" ? `${WEEKDAYS.ru[p.wd]}, ${p.d} ${MONTHS_LONG.ru[p.m]} ${p.y}` : `${WEEKDAYS.uz[p.wd]}, ${p.d}-${MONTHS_LONG.uz[p.m]}, ${p.y}`;
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
  hegrenade: "HE granata", inferno: "Molotov", molotov: "Molotov", incgrenade: "Incendiary", knife: "Pichoq", taser: "Zeus x27",
  world: "Dunyo", planted_c4: "C4",
};
const WEAPON_RU: Record<string, string> = { Pichoq: "Нож", "HE granata": "HE-граната", Dunyo: "Мир" };
export function weaponName(w: string, lang: Lang = "uz"): string {
  const n = w.startsWith("knife") || w === "bayonet" ? "Pichoq" : (WEAPON_NAMES[w] ?? w);
  return lang === "ru" ? (WEAPON_RU[n] ?? n) : n;
}
