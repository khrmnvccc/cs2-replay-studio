import { authed, HttpError, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { enqueueJob } from "@/lib/server/data";

export const POST = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: demo } = await db.from("demo_files").select("id, status").eq("id", id).maybeSingle();
  if (!demo) throw new HttpError(404, "Demo topilmadi");
  if (demo.status === "uploading") throw new HttpError(409, "Demo hali yuklanmagan");
  const job = await enqueueJob(db, user.userId, "parse_demo", { demoFileId: id });
  return json({ ok: true, job });
}, { limit: 10 });
