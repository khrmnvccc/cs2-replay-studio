import { randomBytes } from "node:crypto";
import { z } from "zod";
import { tgCall } from "@shared/notify";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { env } from "@/lib/server/env";
import { assertOwner } from "@/lib/server/notify";
import { adminDb } from "@/lib/server/supabase";

const body = z.object({ token: z.string().trim().regex(/^\d{5,}:[\w-]{30,}$/, "Bot tokeni noto'g'ri (BotFather bergan ko'rinishda bo'lishi kerak)") });

// Sayt egasi bot tokenini kiritadi: tekshiriladi, webhook o'rnatiladi, sozlama bazada saqlanadi
export const POST = authed(async (req, _ctx, user) => {
  assertOwner(user);
  const { token } = await parseBody(req, body);
  let me: { username?: string };
  try {
    me = await tgCall<{ username?: string }>(token, "getMe", {});
  } catch {
    throw new HttpError(400, "Telegram bu tokenni qabul qilmadi");
  }
  if (!me.username) throw new HttpError(400, "Bot username topilmadi");
  const appUrl = env().APP_URL.replace(/\/$/, "");
  const secret = randomBytes(24).toString("hex");
  await tgCall(token, "setWebhook", { url: `${appUrl}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
  await tgCall(token, "setMyCommands", {
    commands: [
      { command: "start", description: "ACE bilan ulash" },
      { command: "stop", description: "Xabarlarni to'xtatish" },
    ],
  }).catch(() => {});
  const { error } = await adminDb().from("app_config").upsert({ key: "telegram", value: { token, username: me.username, secret, appUrl }, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return json({ ok: true, username: me.username });
}, { limit: 10 });
