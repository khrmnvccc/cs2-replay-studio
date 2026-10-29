// Bildirishnoma yuborish: ilova ichidagi ro'yxatga yozadi va (ulangan bo'lsa) Telegram'ga jo'natadi.
// Sayt ham, worker ham ishlatadi; db — service_role klienti. Bot tokeni app_config'da saqlanadi,
// shuning uchun worker'ga alohida Telegram sozlamasi kerak emas.
import type { SupabaseClient } from "@supabase/supabase-js";

export type Lang = "uz" | "ru";
export type Vars = Record<string, string | number | null | undefined>;
export interface TemplateButton {
  label_uz: string;
  label_ru: string;
  kind: "app" | "none";
  path: string;
}
export interface NotificationTemplate {
  key: string;
  category: string;
  sort: number;
  icon: string;
  enabled: boolean;
  required: boolean;
  trigger_uz: string;
  trigger_ru: string;
  title_uz: string;
  title_ru: string;
  body_uz: string;
  body_ru: string;
  buttons: TemplateButton[];
  with_media: boolean;
  telegram: boolean;
  sound: boolean;
  vars: string[];
  updated_at?: string;
}
export interface TelegramConfig {
  token: string;
  username: string;
  secret: string;
  appUrl: string;
}

export const TEMPLATE_COLUMNS =
  "key, category, sort, icon, enabled, required, trigger_uz, trigger_ru, title_uz, title_ru, body_uz, body_ru, buttons, with_media, telegram, sound, vars, updated_at";

/** {map} kabi o'zgaruvchilarni qo'yadi; qiymati yo'q o'zgaruvchi va ortiqcha " · " lar olib tashlanadi. */
export function render(text: string, vars: Vars): string {
  return text
    .replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] == null || vars[k] === "" ? "" : String(vars[k])))
    .split("\n")
    .map((line) => line.split("·").map((s) => s.trim()).filter(Boolean).join(" · "))
    .join("\n")
    .trim();
}

export async function getTelegramConfig(db: SupabaseClient): Promise<TelegramConfig | null> {
  const { data } = await db.from("app_config").select("value").eq("key", "telegram").maybeSingle();
  const v = data?.value as Partial<TelegramConfig> | undefined;
  return v?.token && v.username ? (v as TelegramConfig) : null;
}

export async function tgCall<T = unknown>(token: string, method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(json.description || `Telegram ${method} ${res.status}`);
  return json.result as T;
}

function keyboard(buttons: TemplateButton[], lang: Lang, vars: Vars, appUrl: string) {
  const rows = buttons
    .filter((b) => b.kind === "app" && b.path)
    .slice(0, 3)
    .map((b) => [{ text: render(lang === "ru" ? b.label_ru || b.label_uz : b.label_uz, vars) || "ACE", url: new URL(render(b.path, vars), appUrl).toString() }]);
  return rows.length ? { inline_keyboard: rows } : undefined;
}

/** Telegram xabari (yoki media bo'lsa — video). Ulanmagan bo'lsa — "skipped". */
export async function sendTelegram(
  db: SupabaseClient,
  userId: string,
  msg: { title: Record<Lang, string>; body: Record<Lang, string>; buttons?: TemplateButton[]; vars?: Vars; videoUrl?: string | null; sound?: boolean },
  cfg?: TelegramConfig | null,
): Promise<"sent" | "failed" | "skipped"> {
  const conf = cfg ?? (await getTelegramConfig(db));
  if (!conf) return "skipped";
  const { data: acc } = await db.from("telegram_accounts").select("chat_id, lang").eq("user_id", userId).maybeSingle();
  if (!acc) return "skipped";
  const lang: Lang = acc.lang === "ru" ? "ru" : "uz";
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const text = `<b>${esc(msg.title[lang])}</b>${msg.body[lang] ? `\n\n${esc(msg.body[lang])}` : ""}`;
  const common = {
    chat_id: acc.chat_id,
    parse_mode: "HTML",
    disable_notification: msg.sound === false,
    reply_markup: keyboard(msg.buttons ?? [], lang, msg.vars ?? {}, conf.appUrl),
  };
  try {
    if (msg.videoUrl) {
      try {
        await tgCall(conf.token, "sendVideo", { ...common, video: msg.videoUrl, caption: text, supports_streaming: true });
        return "sent";
      } catch {
        /* video juda katta yoki havola ochilmadi — oddiy xabar bilan */
      }
    }
    await tgCall(conf.token, "sendMessage", { ...common, text, link_preview_options: { is_disabled: true } });
    return "sent";
  } catch (e) {
    console.error("[telegram]", (e as Error).message);
    return "failed";
  }
}

/**
 * Shablon bo'yicha bildirishnoma. Shablon o'chirilgan bo'lsa hech narsa qilmaydi.
 * Xato bo'lsa ham asosiy ishni to'xtatmaydi (faqat log).
 */
export async function notify(db: SupabaseClient, userId: string, key: string, vars: Vars = {}, opts: { videoUrl?: string | null; mapName?: string | null } = {}) {
  try {
    const { data: tpl } = await db.from("notification_templates").select(TEMPLATE_COLUMNS).eq("key", key).maybeSingle();
    const t = tpl as NotificationTemplate | null;
    if (!t || (!t.enabled && !t.required)) return;
    const title = { uz: render(t.title_uz, vars), ru: render(t.title_ru || t.title_uz, vars) };
    const body = { uz: render(t.body_uz, vars), ru: render(t.body_ru || t.body_uz, vars) };
    const first = t.buttons.find((b) => b.kind === "app" && b.path);
    const { data: row } = await db
      .from("notifications")
      .insert({ user_id: userId, template_key: key, icon: t.icon, title, body, link: first ? render(first.path, vars) : null, map_name: opts.mapName ?? null })
      .select("id")
      .single();
    if (!t.telegram) return;
    const status = await sendTelegram(db, userId, { title, body, buttons: t.buttons, vars, videoUrl: t.with_media ? opts.videoUrl : null, sound: t.sound });
    if (row) await db.from("notifications").update({ telegram_status: status }).eq("id", row.id);
  } catch (e) {
    console.error("[notify]", key, (e as Error).message);
  }
}
