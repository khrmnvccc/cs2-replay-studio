import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";
import { adminDb } from "./supabase";
import { sha256 } from "@shared/secret-box";

export const SESSION_COOKIE = "rs_session";
const SESSION_DAYS = 30;

export interface SessionUser {
  sessionId: string;
  userId: string;
  steamId64: string;
  personaName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
}

function key() {
  return new TextEncoder().encode(env().SESSION_SECRET);
}

export async function createSession(userId: string, userAgent: string | null, ip: string | null) {
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const { data, error } = await adminDb()
    .from("sessions")
    .insert({
      user_id: userId,
      expires_at: expires.toISOString(),
      user_agent: userAgent?.slice(0, 300) ?? null,
      ip_hash: ip ? sha256(`${ip}:${env().SESSION_SECRET}`).slice(0, 32) : null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Session yaratilmadi: ${error?.message}`);
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(data.id)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env().APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Cookie + DB dagi session qatorini tekshiradi (bekor qilingan sessionlar ishlamaydi). */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let sid: string, uid: string;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    sid = String(payload.jti);
    uid = String(payload.uid);
  } catch {
    return null;
  }
  const db = adminDb();
  // Ikkala so'rov parallel: uid allaqachon imzolangan tokendan ma'lum
  const [{ data: s }, { data: steam }] = await Promise.all([
    db.from("sessions").select("id, user_id, expires_at, revoked_at, last_seen_at").eq("id", sid).maybeSingle(),
    db.from("steam_accounts").select("steam_id64, persona_name, avatar_url, profile_url").eq("user_id", uid).maybeSingle(),
  ]);
  if (!s || s.user_id !== uid || s.revoked_at || new Date(s.expires_at) < new Date()) return null;
  if (!steam) return null;
  if (Date.now() - new Date(s.last_seen_at).getTime() > 3600_000) {
    await db.from("sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", sid);
  }
  return {
    sessionId: sid,
    userId: uid,
    steamId64: steam.steam_id64,
    personaName: steam.persona_name,
    avatarUrl: steam.avatar_url,
    profileUrl: steam.profile_url,
  };
});

/** Sahifalar uchun: kirmagan bo'lsa bosh sahifaga qaytaradi (xato tashlamaydi). */
export async function pageUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/");
  return s;
}

export async function destroySession(opts: { allDevices?: boolean } = {}) {
  const session = await getSession();
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  if (!session) return;
  const q = adminDb().from("sessions").update({ revoked_at: new Date().toISOString() });
  await (opts.allDevices ? q.eq("user_id", session.userId).is("revoked_at", null) : q.eq("id", session.sessionId));
}
