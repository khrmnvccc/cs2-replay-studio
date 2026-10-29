"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { isLang, makeT, translate, type Lang, type TFn, type Vars } from "@/lib/i18n";

const Ctx = createContext<{ lang: Lang; t: TFn }>({ lang: "uz", t: makeT("uz") });

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;

/** Hook ishlatib bo'lmaydigan joylar uchun (toast, xato xabarlari) — sahifa tilidan. */
export function tc(key: string, vars?: Vars): string {
  const l = typeof document !== "undefined" ? document.documentElement.lang : "uz";
  return translate(isLang(l) ? l : "uz", key, vars);
}
