import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { verifySteamOpenId } from "@/lib/steam/openid";
import { getProfile } from "@/lib/steam/web-api";
import { env } from "@/lib/server/env";
import { adminDb } from "@/lib/server/supabase";
import { createSession } from "@/lib/server/session";
import { clientIp } from "@/lib/server/http";

const STATE_COOKIE = "rs_openid_state";

function fail(appUrl: string, reason: string) {
  const url = new URL("/", appUrl);
  url.searchParams.set("auth_error", reason);
  const res = NextResponse.redirect(url);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/steam" });
  return res;
}

export async function GET(req: Request) {
  const { APP_URL, STEAM_API_KEY } = env();
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "";
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value ?? "";
  if (!state || state.length !== expected.length || !timingSafeEqual(Buffer.from(state), Buffer.from(expected))) {
    return fail(APP_URL, "Sessiya holati mos kelmadi, qaytadan urinib ko'ring");
  }

  const result = await verifySteamOpenId(url.searchParams, {
    expectedReturnTo: `${APP_URL}/api/auth/steam/callback?state=${state}`,
  });
  if (!result.ok) return fail(APP_URL, result.error);

  const db = adminDb();
  // Replay himoyasi: bir xil response_nonce ikkinchi marta qabul qilinmaydi
  const { error: nonceErr } = await db.from("openid_nonces").insert({ nonce: result.nonce });
  if (nonceErr) return fail(APP_URL, "Bu kirish javobi allaqachon ishlatilgan");

  let profile;
  try {
    profile = await getProfile(STEAM_API_KEY, result.steamId64);
  } catch (e) {
    return fail(APP_URL, e instanceof Error ? e.message : "Steam profili olinmadi");
  }

  const { data: existing } = await db.from("steam_accounts").select("user_id").eq("steam_id64", profile.steamId64).maybeSingle();
  let userId = existing?.user_id as string | undefined;
  if (!userId) {
    const { data: u, error } = await db.from("users").insert({}).select("id").single();
    if (error || !u) return fail(APP_URL, "Foydalanuvchi yaratilmadi");
    userId = u.id as string;
  }
  const { error: upErr } = await db.from("steam_accounts").upsert(
    {
      user_id: userId,
      steam_id64: profile.steamId64,
      persona_name: profile.personaName,
      avatar_url: profile.avatarUrl,
      profile_url: profile.profileUrl,
      country_code: profile.countryCode,
    },
    { onConflict: "steam_id64" },
  );
  if (upErr) return fail(APP_URL, "Steam akkaunt saqlanmadi");
  await db.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
  // eski nonce'larni tozalash
  await db.from("openid_nonces").delete().lt("created_at", new Date(Date.now() - 864e5).toISOString());

  await createSession(userId, req.headers.get("user-agent"), clientIp(req));
  const res = NextResponse.redirect(new URL("/dashboard", APP_URL));
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/auth/steam" });
  return res;
}
