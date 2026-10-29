import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getTelegramConfig, notify, tgCall } from "@shared/notify";
import { adminDb } from "@/lib/server/supabase";

type Update = { message?: { text?: string; chat: { id: number; type: string }; from?: { username?: string; first_name?: string; language_code?: string } } };

const TEXT = {
  uz: {
    hello: "Salom! Bu ACE — CS2 matchlaringiz va kliplaringiz boti.\n\nUlash uchun saytda Menyu → Telegram ni bosing.",
    expired: "Ulash havolasi eskirgan. Saytda Menyu → Telegram ni qayta bosing.",
    stopped: "Telegram uzildi. Endi xabar yubormayman.",
    open: "ACE ni ochish",
  },
  ru: {
    hello: "Привет! Это ACE — бот ваших матчей и клипов CS2.\n\nЧтобы подключить, на сайте нажмите Меню → Telegram.",
    expired: "Ссылка устарела. На сайте снова нажмите Меню → Telegram.",
    stopped: "Telegram отключён. Больше не буду присылать сообщения.",
    open: "Открыть ACE",
  },
};

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Telegram bot webhook: /start <kod> — akkauntni ulash, /stop — uzish
export async function POST(req: Request) {
  const db = adminDb();
  const cfg = await getTelegramConfig(db);
  if (!cfg || !same(req.headers.get("x-telegram-bot-api-secret-token") ?? "", cfg.secret)) return new NextResponse(null, { status: 401 });

  const update = (await req.json().catch(() => ({}))) as Update;
  const msg = update.message;
  if (!msg?.text || msg.chat.type !== "private") return NextResponse.json({ ok: true });
  const lang = msg.from?.language_code?.startsWith("ru") ? "ru" : "uz";
  const T = TEXT[lang];
  const reply = (text: string) =>
    tgCall(cfg.token, "sendMessage", { chat_id: msg.chat.id, text, reply_markup: { inline_keyboard: [[{ text: T.open, url: `${cfg.appUrl}/matches` }]] } }).catch(() => {});

  const [cmd, arg] = msg.text.trim().split(/\s+/, 2);
  if (cmd === "/start" && arg) {
    const { data: tok } = await db.from("telegram_link_tokens").select("user_id, expires_at").eq("token", arg).maybeSingle();
    if (!tok || new Date(tok.expires_at) < new Date()) {
      await reply(T.expired);
      return NextResponse.json({ ok: true });
    }
    await db.from("telegram_link_tokens").delete().eq("token", arg);
    // Bitta Telegram — bitta ACE akkaunt
    await db.from("telegram_accounts").delete().eq("chat_id", msg.chat.id);
    await db.from("telegram_accounts").upsert({ user_id: tok.user_id, chat_id: msg.chat.id, username: msg.from?.username ?? null, first_name: msg.from?.first_name ?? null, lang, linked_at: new Date().toISOString() });
    await notify(db, tok.user_id, "telegram_linked");
  } else if (cmd === "/stop") {
    await db.from("telegram_accounts").delete().eq("chat_id", msg.chat.id);
    await reply(T.stopped);
  } else {
    await reply(T.hello);
  }
  return NextResponse.json({ ok: true });
}
