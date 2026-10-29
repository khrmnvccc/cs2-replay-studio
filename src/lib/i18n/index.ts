import { RU } from "./ru";

// Tarjima: kalit — o'zbekcha matnning o'zi. Rus tilida lug'atdan olinadi, topilmasa o'zbekchasi qoladi.
export const LANGS = ["uz", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export type Vars = Record<string, string | number>;
export type TFn = (key: string, vars?: Vars) => string;

export const LANG_COOKIE = "lang";
export const THEME_COOKIE = "theme";

export function isLang(v: unknown): v is Lang {
  return v === "uz" || v === "ru";
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  let s = lang === "ru" ? (RU[key] ?? key) : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function makeT(lang: Lang): TFn {
  return (key, vars) => translate(lang, key, vars);
}
