import { authed, HttpError, json } from "@/lib/server/http";
import { env } from "@/lib/server/env";
import { adminDb, userDb } from "@/lib/server/supabase";
import { enqueueJob } from "@/lib/server/data";
import { detectDemoMagic } from "@shared/demo-file";

// 2-qadam: yuklangan faylni tekshirish (hajm + magic baytlar) va tahlilni navbatga qo'yish.
export const POST = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: demo } = await db.from("demo_files").select("id, storage_path, size_bytes, status, compression").eq("id", id).maybeSingle();
  if (!demo) throw new HttpError(404, "Demo topilmadi");
  if (demo.status !== "uploading") throw new HttpError(409, "Demo allaqachon qayta ishlangan");

  const e = env();
  const admin = adminDb();
  const fail = async (msg: string) => {
    await admin.storage.from("demos").remove([demo.storage_path]);
    await admin.from("demo_files").update({ status: "failed", error: msg }).eq("id", id);
    throw new HttpError(400, msg);
  };

  // Faylning birinchi baytlarini o'qish (Range so'rovi — butun faylni yuklamaymiz)
  const res = await fetch(`${e.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/authenticated/demos/${demo.storage_path}`, {
    headers: { Authorization: `Bearer ${e.SUPABASE_SERVICE_ROLE_KEY}`, apikey: e.SUPABASE_SERVICE_ROLE_KEY, Range: "bytes=0-15" },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 400) throw new HttpError(409, "Fayl hali storage'ga to'liq yuklanmagan");
  if (!res.ok) throw new HttpError(502, `Storage xatosi (${res.status})`);
  const head = new Uint8Array(await res.arrayBuffer()).slice(0, 16);
  const magic = detectDemoMagic(head);
  if (magic === "csgo") return fail("Bu CS:GO demo. Faqat CS2 (Source 2) demolar qo'llab-quvvatlanadi.");
  if (magic === null || magic !== demo.compression) return fail("Fayl CS2 demo emas (signatura mos kelmadi). Fayl o'chirildi.");

  // Haqiqiy hajmni tekshirish
  const total = Number(res.headers.get("content-range")?.split("/")[1] ?? NaN);
  if (Number.isFinite(total) && total !== Number(demo.size_bytes)) {
    await admin.from("demo_files").update({ size_bytes: total }).eq("id", id);
  }
  if (Number.isFinite(total) && total > e.DEMO_MAX_MB * 1024 * 1024) return fail("Fayl ruxsat etilgan hajmdan katta");

  await admin.from("demo_files").update({ status: "uploaded", error: null }).eq("id", id);
  const job = await enqueueJob(db, user.userId, "parse_demo", { demoFileId: id });
  return json({ ok: true, job });
}, { limit: 20 });
