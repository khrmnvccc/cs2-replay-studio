import { describe, expect, it, vi } from "vitest";
import { buildSteamLoginUrl, verifySteamOpenId } from "@/lib/steam/openid";

const RETURN_TO = "https://app.example.com/api/auth/steam/callback?state=abc";
const NOW = new Date("2026-10-20T12:00:00Z");

function steamResponse(over: Record<string, string> = {}) {
  const p = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "id_res",
    "openid.op_endpoint": "https://steamcommunity.com/openid/login",
    "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000001",
    "openid.identity": "https://steamcommunity.com/openid/id/76561198000000001",
    "openid.return_to": RETURN_TO,
    "openid.response_nonce": "2026-10-20T11:59:30Zabcdef",
    "openid.assoc_handle": "1234567890",
    "openid.signed": "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
    "openid.sig": "c2lnbmF0dXJl",
    state: "abc",
  });
  for (const [k, v] of Object.entries(over)) p.set(k, v);
  return p;
}

const okFetch = () => vi.fn(async () => new Response("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"));

describe("Steam OpenID", () => {
  it("login URL to'g'ri parametrlar bilan", () => {
    const u = new URL(buildSteamLoginUrl(RETURN_TO, "https://app.example.com"));
    expect(u.origin + u.pathname).toBe("https://steamcommunity.com/openid/login");
    expect(u.searchParams.get("openid.mode")).toBe("checkid_setup");
    expect(u.searchParams.get("openid.return_to")).toBe(RETURN_TO);
  });

  it("haqiqiy javobni qabul qiladi va check_authentication yuboradi", async () => {
    const f = okFetch();
    const r = await verifySteamOpenId(steamResponse(), { expectedReturnTo: RETURN_TO, fetchImpl: f as unknown as typeof fetch, now: NOW });
    expect(r).toEqual({ ok: true, steamId64: "76561198000000001", nonce: "2026-10-20T11:59:30Zabcdef" });
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    const body = new URLSearchParams(String(init.body));
    expect(body.get("openid.mode")).toBe("check_authentication");
    expect(body.get("state")).toBeNull(); // faqat openid.* maydonlar
  });

  it("Steam is_valid:false qaytarsa rad etadi", async () => {
    const f = vi.fn(async () => new Response("is_valid:false\n"));
    const r = await verifySteamOpenId(steamResponse(), { expectedReturnTo: RETURN_TO, fetchImpl: f as unknown as typeof fetch, now: NOW });
    expect(r.ok).toBe(false);
  });

  it.each([
    ["boshqa OP endpoint", { "openid.op_endpoint": "https://evil.com/openid/login" }],
    ["boshqa return_to", { "openid.return_to": "https://evil.com/cb" }],
    ["soxta claimed_id", { "openid.claimed_id": "https://evil.com/openid/id/76561198000000001", "openid.identity": "https://evil.com/openid/id/76561198000000001" }],
    ["identity != claimed_id", { "openid.identity": "https://steamcommunity.com/openid/id/76561198000000002" }],
    ["claimed_id imzolanmagan", { "openid.signed": "signed,op_endpoint,identity,return_to,response_nonce,assoc_handle" }],
    ["eski nonce", { "openid.response_nonce": "2026-10-20T10:00:00Zabc" }],
    ["cancel", { "openid.mode": "cancel" }],
  ])("%s rad etiladi (Steam'ga so'rov yuborilmaydi)", async (_name, over) => {
    const f = okFetch();
    const r = await verifySteamOpenId(steamResponse(over), { expectedReturnTo: RETURN_TO, fetchImpl: f as unknown as typeof fetch, now: NOW });
    expect(r.ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
