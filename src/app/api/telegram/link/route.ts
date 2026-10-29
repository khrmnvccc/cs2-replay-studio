import { randomBytes } from "node:crypto";
import { getTelegramConfig } from "@shared/notify";
import { authed, HttpError, json } from "@/lib/server/http";
import { adminDb } from "@/lib/server/supabase";

// Telegram'ni ulash: bir martalik kod bilan t.me havolasi (15 daqiqa amal qiladi)
export const POST = authed(async (_req, _ctx, user) => {
  const db = adminDb();
  const cfg = await getTelegramConfig(db);
  if (!cfg) throw new HttpError(503, "Telegram bot hali sozlanmagan");
  const token = randomBytes(18).toString("base64url");
  await db.from("telegram_link_tokens").delete().eq("user_id", user.userId);
  const { error } = await db.from("telegram_link_tokens").insert({ user_id: user.userId, token, expires_at: new Date(Date.now() + 15 * 60_000).toISOString() });
  if (error) throw new Error(error.message);
  return json({ url: `https://t.me/${cfg.username}?start=${token}` });
}, { limit: 10 });

export const DELETE = authed(async (_req, _ctx, user) => {
  const { error } = await adminDb().from("telegram_accounts").delete().eq("user_id", user.userId);
  if (error) throw new Error(error.message);
  return json({ ok: true });
}, { limit: 10 });
