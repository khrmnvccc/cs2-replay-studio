import { NextResponse } from "next/server";
import { authed, HttpError } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";
import { externalDemoUrl, isExternalDemoPath } from "@shared/demo-file";

// Demo faylni yuklab olish: egalik RLS orqali tekshiriladi, keyin 60 soniyalik signed URL.
export const GET = authed<{ params: Promise<{ id: string }> }>(async (_req, ctx, user) => {
  const { id } = await ctx.params;
  const db = await userDb(user.userId);
  const { data: demo } = await db.from("demo_files").select("storage_path, original_name, status").eq("id", id).maybeSingle();
  if (!demo || demo.status === "uploading") throw new HttpError(404, "Demo topilmadi");
  // Katta Valve demosi storage'da emas — Valve serveridagi asl faylga yo'naltiramiz
  if (isExternalDemoPath(demo.storage_path)) return NextResponse.redirect(externalDemoUrl(demo.storage_path));
  const { data, error } = await adminDb().storage.from("demos").createSignedUrl(demo.storage_path, 60, { download: demo.original_name });
  if (error || !data) throw new HttpError(404, "Demo fayli storage'da topilmadi (saqlash muddati o'tgan bo'lishi mumkin)");
  return NextResponse.redirect(data.signedUrl);
});
