import { z } from "zod";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { enqueueJob } from "@/lib/server/data";

const body = z.object({ clipIds: z.array(z.string().uuid()).min(1).max(100) });

// Ko'p clipni ZIP qilish worker'da bajariladi (katta fayllar serverless limitlariga sig'maydi).
export const POST = authed(async (req, _ctx, user) => {
  const { clipIds } = await parseBody(req, body);
  const db = await userDb(user.userId);
  const { data } = await db.from("clips").select("id").in("id", clipIds).eq("status", "ready");
  if (!data?.length) throw new HttpError(409, "Tanlanganlar ichida tayyor (render qilingan) clip yo'q");
  const job = await enqueueJob(db, user.userId, "zip_clips", { clipIds: data.map((c) => c.id) }, 2);
  return json({ ok: true, job, included: data.length });
}, { limit: 10 });
