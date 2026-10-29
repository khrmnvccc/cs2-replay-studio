import "server-only";
import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, makeT, THEME_COOKIE, type Lang } from "./index";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "uz";
}

export async function getTheme(): Promise<"light" | "dark"> {
  return (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
