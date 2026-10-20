import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ConfigError, env } from "./env";
import { getSession, type SessionUser } from "./session";
import { rateLimit } from "./rate-limit";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Avval Steam orqali kiring");
  return s;
}

/** CSRF: o'zgartiruvchi so'rovlar faqat o'z domenimizdan kelishi kerak. */
export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const app = new URL(env().APP_URL).origin;
  if (!origin || origin !== app) throw new HttpError(403, "Ruxsat etilmagan manba (CSRF)");
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "JSON body noto'g'ri");
  }
  return schema.parse(raw);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

type Handler<C> = (req: Request, ctx: C, user: SessionUser) => Promise<Response>;

/** Autentifikatsiya + CSRF + rate limit + xatolarni bir xil formatda qaytarish. */
export function authed<C>(handler: Handler<C>, opts: { limit?: number; windowMs?: number } = {}) {
  return async (req: Request, ctx: C) => {
    try {
      assertSameOrigin(req);
      const user = await requireUser();
      const rl = rateLimit(`${user.userId}:${new URL(req.url).pathname}`, opts.limit ?? 60, opts.windowMs ?? 60_000);
      if (!rl.ok) {
        return json({ error: "Juda ko'p so'rov. Birozdan keyin urinib ko'ring." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
      }
      return await handler(req, ctx, user);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) return json({ error: e.issues.map((i) => i.message).join("; ") }, { status: 400 });
  if (e instanceof ConfigError) return json({ error: e.message }, { status: 503 });
  console.error(e);
  return json({ error: "Serverda kutilmagan xato" }, { status: 500 });
}
