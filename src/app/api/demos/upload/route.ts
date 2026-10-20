import { z } from "zod";
import { randomUUID } from "node:crypto";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { env } from "@/lib/server/env";
import { mintSupabaseJwt, userDb } from "@/lib/server/supabase";
import { checkDemoName, demoObjectPath } from "@shared/demo-file";

const body = z.object({
  name: z.string().min(1).max(200),
  size: z.number().int().positive(),
  matchId: z.string().uuid().optional(),
});

// 1-qadam: demo_files qatorini yaratish va brauzerga Supabase TUS (resumable) upload
// uchun qisqa muddatli token berish. Fayl Vercel funksiyasi orqali o'tmaydi.
export const POST = authed(async (req, _ctx, user) => {
  const { name, size, matchId } = await parseBody(req, body);
  const e = env();
  const check = checkDemoName(name, size, e.DEMO_MAX_MB * 1024 * 1024);
  if (!check.ok) throw new HttpError(400, check.error!);
  const db = await userDb(user.userId);
  if (matchId) {
    const { data } = await db.from("matches").select("id").eq("id", matchId).maybeSingle();
    if (!data) throw new HttpError(404, "Match topilmadi");
  }
  const id = randomUUID();
  const objectName = demoObjectPath(user.userId, id, check.compression!);
  const { error } = await db.from("demo_files").insert({
    id,
    user_id: user.userId,
    match_id: matchId ?? null,
    storage_path: objectName,
    original_name: name,
    size_bytes: size,
    compression: check.compression,
    status: "uploading",
  });
  if (error) throw new Error(error.message);
  return json({
    demoId: id,
    bucket: "demos",
    objectName,
    endpoint: `${e.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
    anonKey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    token: await mintSupabaseJwt(user.userId, 2 * 3600),
  });
}, { limit: 20 });
