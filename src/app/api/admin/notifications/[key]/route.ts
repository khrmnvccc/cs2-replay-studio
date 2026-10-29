import { z } from "zod";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { assertOwner } from "@/lib/server/notify";
import { adminDb } from "@/lib/server/supabase";

const text = (max: number) => z.string().max(max);
const body = z.object({
  enabled: z.boolean(),
  title_uz: text(120).min(1, "Sarlavha bo'sh bo'lmasin"),
  title_ru: text(120),
  body_uz: text(1000),
  body_ru: text(1000),
  buttons: z
    .array(z.object({ label_uz: text(40), label_ru: text(40), kind: z.enum(["app", "none"]), path: z.string().max(200).regex(/^(\/[\w\-/{}.?=&]*)?$/, "Manzil / bilan boshlansin") }))
    .max(3),
  with_media: z.boolean(),
  telegram: z.boolean(),
  sound: z.boolean(),
});

export const PUT = authed<{ params: Promise<{ key: string }> }>(async (req, ctx, user) => {
  assertOwner(user);
  const { key } = await ctx.params;
  const patch = await parseBody(req, body);
  const db = adminDb();
  const { data: cur } = await db.from("notification_templates").select("required").eq("key", key).maybeSingle();
  if (!cur) throw new HttpError(404, "Shablon topilmadi");
  const { error } = await db.from("notification_templates").update({ ...patch, enabled: cur.required ? true : patch.enabled }).eq("key", key);
  if (error) throw new Error(error.message);
  return json({ ok: true });
}, { limit: 60 });
