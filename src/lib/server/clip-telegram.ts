import "server-only";
import { sendTelegram } from "@shared/notify";
import { adminDb } from "./supabase";

/** Tayyor klip videosini foydalanuvchining Telegram'iga yuboradi. */
export async function sendClipToTelegram(userId: string, clip: { title: string; storage_path: string }) {
  const db = adminDb();
  const { data } = await db.storage.from("clips").createSignedUrl(clip.storage_path, 3600);
  return sendTelegram(db, userId, {
    title: { uz: clip.title, ru: clip.title },
    body: { uz: "ACE · CS2 klip", ru: "ACE · CS2 клип" },
    buttons: [{ label_uz: "Kliplarim", label_ru: "Мои клипы", kind: "app", path: "/clips" }],
    videoUrl: data?.signedUrl ?? null,
  });
}
