import { authed, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { getMatch } from "@/lib/server/data";

export const DELETE = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  await getMatch(db, id);
  const { error } = await db.from("matches").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return json({ ok: true });
});
