import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { buildSteamLoginUrl } from "@/lib/steam/openid";
import { env } from "@/lib/server/env";
import { clientIp, errorResponse } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";

const STATE_COOKIE = "rs_openid_state";

export async function GET(req: Request) {
  try {
    const rl = rateLimit(`login:${clientIp(req)}`, 20, 60_000);
    if (!rl.ok) return NextResponse.json({ error: "Juda ko'p urinish" }, { status: 429 });
    const { APP_URL } = env();
    const state = randomBytes(16).toString("hex");
    const returnTo = `${APP_URL}/api/auth/steam/callback?state=${state}`;
    const res = NextResponse.redirect(buildSteamLoginUrl(returnTo, APP_URL));
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: APP_URL.startsWith("https://"),
      sameSite: "lax",
      path: "/api/auth/steam",
      maxAge: 600,
    });
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
