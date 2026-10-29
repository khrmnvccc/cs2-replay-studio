import { authed, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";

// Hammasini o'qilgan deb belgilash
export const POST = authed(async (_req, _ctx, user) => {
  const db = await userDb(user.userId);
  const { error } = await db.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (error) throw new Error(error.message);
  return json({ ok: true });
}, { limit: 60 });
