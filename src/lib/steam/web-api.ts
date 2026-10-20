// Steam Web API: faqat haqiqiy, hujjatlashtirilgan endpointlar.
//  - ISteamUser/GetPlayerSummaries/v2
//  - ICSGOPlayers_730/GetNextMatchSharingCode/v1 (CS2 matchmaking tarixi uchun)
const API = "https://api.steampowered.com";

export class SteamApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function steamFetch(url: string, fetchImpl: typeof fetch, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
      // 429 / 5xx — qayta urinish (exponential backoff)
      if (res.status === 429 || res.status >= 500) {
        lastErr = new SteamApiError(`Steam API ${res.status}`, res.status);
        await new Promise((r) => setTimeout(r, 500 * 2 ** i));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  if (lastErr instanceof SteamApiError) throw lastErr;
  throw new SteamApiError("Steam API'ga ulanib bo'lmadi");
}

export interface SteamProfile {
  steamId64: string;
  personaName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  countryCode: string | null;
}

export async function getPlayerSummary(apiKey: string, steamId64: string, fetchImpl: typeof fetch = fetch): Promise<SteamProfile> {
  const url = `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(apiKey)}&steamids=${steamId64}`;
  const res = await steamFetch(url, fetchImpl);
  if (res.status === 403) throw new SteamApiError("STEAM_API_KEY noto'g'ri yoki bloklangan", 403);
  if (!res.ok) throw new SteamApiError(`Steam API xatosi ${res.status}`, res.status);
  const json = (await res.json()) as { response?: { players?: Array<Record<string, unknown>> } };
  const p = json.response?.players?.[0];
  if (!p || p.steamid !== steamId64) throw new SteamApiError("Steam profili topilmadi");
  return {
    steamId64,
    personaName: String(p.personaname ?? "Steam user"),
    avatarUrl: typeof p.avatarfull === "string" ? p.avatarfull : null,
    profileUrl: typeof p.profileurl === "string" ? p.profileurl : null,
    countryCode: typeof p.loccountrycode === "string" ? p.loccountrycode : null,
  };
}

export type NextShareCodeResult =
  | { kind: "next"; code: string }
  | { kind: "none" } // yangi match yo'q
  | { kind: "invalid_auth" } // auth code yoki steamid noto'g'ri
  | { kind: "invalid_known_code" }; // knowncode bu foydalanuvchiga tegishli emas

/**
 * Valve: 200 + {result:{nextcode}} — keyingi match; nextcode "n/a" (202) — yangi match yo'q;
 * 403 — auth code noto'g'ri; 412 — knowncode noto'g'ri.
 */
export async function getNextMatchSharingCode(
  apiKey: string,
  steamId64: string,
  authCode: string,
  knownCode: string,
  fetchImpl: typeof fetch = fetch,
): Promise<NextShareCodeResult> {
  const qs = new URLSearchParams({ key: apiKey, steamid: steamId64, steamidkey: authCode, knowncode: knownCode });
  const res = await steamFetch(`${API}/ICSGOPlayers_730/GetNextMatchSharingCode/v1?${qs}`, fetchImpl);
  if (res.status === 403) return { kind: "invalid_auth" };
  if (res.status === 412) return { kind: "invalid_known_code" };
  if (res.status === 202) return { kind: "none" };
  if (!res.ok) throw new SteamApiError(`GetNextMatchSharingCode xatosi ${res.status}`, res.status);
  const json = (await res.json()) as { result?: { nextcode?: string } };
  const code = json.result?.nextcode;
  if (!code || code === "n/a") return { kind: "none" };
  return { kind: "next", code };
}
