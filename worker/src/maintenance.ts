import { isExternalDemoPath } from "../../shared/demo-file";
import { mapMeta } from "../../shared/maps";
import { notify } from "../../shared/notify";
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
      const stored = old.map((d) => d.storage_path as string).filter((p) => !isExternalDemoPath(p));
      if (stored.length) await db.storage.from("demos").remove(stored);
      await db
        .from("demo_files")
        .update({ status: "expired", error: `Saqlash muddati (${days} kun) tugadi — fayl o'chirildi, tahlil natijalari saqlangan` })
        .in("id", old.map((d) => d.id));
    }

    // Eslatma: ertaga o'chiriladigan demolar (har bir match uchun bir marta)
    const soon = new Date(Date.now() - (days - 1) * 864e5).toISOString();
    const { data: expiring } = await db
      .from("demo_files")
      .select("match_id, matches(map_name)")
      .eq("user_id", u.id)
      .eq("status", "parsed")
      .not("match_id", "is", null)
      .gte("created_at", cutoff)
      .lt("created_at", soon)
      .limit(20);
    for (const d of expiring ?? []) {
      const link = `/matches/${d.match_id}`;
      const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", u.id).eq("template_key", "demo_expiring").eq("link", link);
      if (count) continue;
      const map = (d.matches as { map_name?: string | null } | null)?.map_name ?? null;
      await notify(db, u.id, "demo_expiring", { map: mapMeta(map).name, matchId: d.match_id }, { mapName: map });
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
