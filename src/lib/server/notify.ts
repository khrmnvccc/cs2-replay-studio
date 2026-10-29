import "server-only";
import { notify, type Vars } from "@shared/notify";
import { HttpError } from "./http";
import { isOwner, type SessionUser } from "./session";
import { adminDb } from "./supabase";

/** Sayt tomonidan bildirishnoma (service_role bilan). */
export function notifyUser(userId: string, key: string, vars: Vars = {}, opts: { videoUrl?: string | null; mapName?: string | null } = {}) {
  return notify(adminDb(), userId, key, vars, opts);
}

export function assertOwner(user: SessionUser) {
  if (!isOwner(user)) throw new HttpError(403, "Bu bo'lim faqat sayt egasi uchun");
}
