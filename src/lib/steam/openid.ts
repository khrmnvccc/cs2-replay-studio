// Steam OpenID 2.0 (https://steamcommunity.com/openid). Parol hech qachon bizga kelmaydi:
// foydalanuvchi Steam saytida kiradi, Steam bizga imzolangan javob qaytaradi,
// biz uni check_authentication orqali Steam serverida qayta tekshiramiz.
export const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";
const CLAIMED_ID_RE = /^https:\/\/steamcommunity\.com\/openid\/id\/(7656119\d{10})$/;
const NONCE_MAX_AGE_MS = 5 * 60 * 1000;

export function buildSteamLoginUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

export type OpenIdResult =
  | { ok: true; steamId64: string; nonce: string }
  | { ok: false; error: string };

export interface VerifyOptions {
  /** Kutilgan return_to (state parametri bilan birga) */
  expectedReturnTo: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}

/** Steam javobini qat'iy tekshiradi. */
export async function verifySteamOpenId(query: URLSearchParams, opts: VerifyOptions): Promise<OpenIdResult> {
  const get = (k: string) => query.get(`openid.${k}`);
  if (get("mode") === "cancel") return { ok: false, error: "Kirish bekor qilindi" };
  if (get("ns") !== OPENID_NS) return { ok: false, error: "OpenID ns noto'g'ri" };
  if (get("mode") !== "id_res") return { ok: false, error: "OpenID mode noto'g'ri" };
  if (get("op_endpoint") !== STEAM_OPENID_ENDPOINT) return { ok: false, error: "OP endpoint Steam emas" };
  if (get("return_to") !== opts.expectedReturnTo) return { ok: false, error: "return_to mos kelmadi" };

  const claimed = get("claimed_id") ?? "";
  const identity = get("identity") ?? "";
  const m = CLAIMED_ID_RE.exec(claimed);
  if (!m || identity !== claimed) return { ok: false, error: "Steam ID formati noto'g'ri" };

  const signed = (get("signed") ?? "").split(",");
  for (const required of ["op_endpoint", "claimed_id", "identity", "return_to", "response_nonce", "assoc_handle"]) {
    if (!signed.includes(required)) return { ok: false, error: `Imzolanmagan maydon: ${required}` };
  }

  const nonce = get("response_nonce") ?? "";
  const ts = Date.parse(nonce.slice(0, 20));
  const now = (opts.now ?? new Date()).getTime();
  if (!Number.isFinite(ts) || Math.abs(now - ts) > NONCE_MAX_AGE_MS) {
    return { ok: false, error: "Javob muddati o'tgan (nonce)" };
  }

  // Steam serverida imzoni tekshirish
  const body = new URLSearchParams();
  for (const [k, v] of query.entries()) if (k.startsWith("openid.")) body.set(k, v);
  body.set("openid.mode", "check_authentication");

  const fetchImpl = opts.fetchImpl ?? fetch;
  let text: string;
  try {
    const res = await fetchImpl(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `Steam tekshiruvi xatosi (HTTP ${res.status})` };
    text = await res.text();
  } catch {
    return { ok: false, error: "Steam serveriga ulanib bo'lmadi" };
  }
  const isValid = text.split("\n").some((line) => line.trim() === "is_valid:true");
  if (!isValid) return { ok: false, error: "Steam imzoni tasdiqlanmadi" };
  return { ok: true, steamId64: m[1], nonce };
}
