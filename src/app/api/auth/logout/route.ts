import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/session";
import { assertSameOrigin, errorResponse } from "@/lib/server/http";
import { env } from "@/lib/server/env";

// POST /api/auth/logout            — shu qurilmadan chiqish
// POST /api/auth/logout?all=1      — barcha qurilmalardan chiqish
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const all = new URL(req.url).searchParams.get("all") === "1";
    await destroySession({ allDevices: all });
    return NextResponse.redirect(new URL("/", env().APP_URL), { status: 303 });
  } catch (e) {
    return errorResponse(e);
  }
}
