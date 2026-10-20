import { authed, json } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { JOB_COLUMNS } from "@/lib/server/data";

// Progress polling: GET /api/jobs?ids=a,b,c  yoki  GET /api/jobs (faol ishlar)
export const GET = authed(async (req, _ctx, user) => {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter((s) => /^[0-9a-f-]{36}$/.test(s)).slice(0, 50);
  const db = await userDb(user.userId);
  let q = db.from("processing_jobs").select(JOB_COLUMNS);
  q = ids.length ? q.in("id", ids) : q.in("status", ["queued", "running"]).order("created_at", { ascending: false }).limit(50);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return json({ jobs: data });
}, { limit: 120 });
