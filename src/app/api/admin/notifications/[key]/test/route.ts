import { notify } from "@shared/notify";
import { authed, json } from "@/lib/server/http";
import { assertOwner } from "@/lib/server/notify";
import { adminDb } from "@/lib/server/supabase";

const SAMPLE = { map: "Mirage", score: "13 : 1", kills: 21, title: "Mirage · AK-47 ace", n: 5, error: "Sinov xabari", matchId: "" };

// Shablonni o'zimga sinab yuborish (ilova + Telegram)
export const POST = authed<{ params: Promise<{ key: string }> }>(async (_req, ctx, user) => {
  assertOwner(user);
  const { key } = await ctx.params;
  await notify(adminDb(), user.userId, key, SAMPLE);
  return json({ ok: true });
}, { limit: 20 });
