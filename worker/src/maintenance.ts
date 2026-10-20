import type { SupabaseClient } from "@supabase/supabase-js";

// Har soatda: (1) o'lgan ishlarni qayta navbatga qo'yish, (2) saqlash muddati o'tgan
// demo fayllar va ZIP eksportlarni storage'dan o'chirish (foydalanuvchi sozlamasi: retention_days).
export async function maintenance(db: SupabaseClient) {
  await db.rpc("requeue_stale_jobs", { p_stale: "10 minutes" });

  const { data: users } = await db.from("users").select("id, settings");
  for (const u of users ?? []) {
    const days = Number(u.settings?.retention_days ?? 30);
    const cutoff = new Date(Date.now() - days * 864e5).toISOString();
    const { data: old } = await db
      .from("demo_files")
      .select("id, storage_path")
      .eq("user_id", u.id)
      .in("status", ["parsed", "failed", "uploaded"])
      .lt("created_at", cutoff)
      .limit(200);
    if (old?.length) {
      await db.storage.from("demos").remove(old.map((d) => d.storage_path));
      await db
        .from("demo_files")
        .update({ status: "expired", error: `Saqlash muddati (${days} kun) tugadi — fayl o'chirildi, tahlil natijalari saqlangan` })
        .in("id", old.map((d) => d.id));
    }
  }

  const { data: exports } = await db
    .from("processing_jobs")
    .select("id, result")
    .eq("type", "zip_clips")
    .eq("status", "succeeded")
    .lt("updated_at", new Date(Date.now() - 864e5).toISOString())
    .limit(200);
  const paths = (exports ?? []).map((e) => e.result?.path).filter(Boolean) as string[];
  if (paths.length) {
    await db.storage.from("exports").remove(paths);
    await db.from("processing_jobs").update({ result: { expired: true } }).in("id", (exports ?? []).map((e) => e.id));
  }
}
