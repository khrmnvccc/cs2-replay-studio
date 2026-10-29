import { authed, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";

export const GET = authed(async (_req, _ctx, user) => {
  const db = await userDb(user.userId);
  const { data, error } = await db.from("notifications").select("id, template_key, icon, title, body, link, map_name, read_at, created_at").order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return json({ notifications: data ?? [] });
}, { limit: 120 });
