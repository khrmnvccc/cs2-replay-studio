// SteamID64 <-> 32-bit account ID
const BASE = 76561197960265728n;

export const STEAM_ID64_RE = /^7656119\d{10}$/;

export function accountIdToSteamId64(accountId: number | string): string {
  return (BASE + BigInt(accountId)).toString();
}

export function steamId64ToAccountId(steamId64: string): number {
  if (!STEAM_ID64_RE.test(steamId64)) throw new Error("Noto'g'ri SteamID64");
  return Number(BigInt(steamId64) - BASE);
}

/** Steam "Game Authentication Code" formati: XXXX-XXXXX-XXXX */
export const AUTH_CODE_RE = /^[A-Z0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{4}$/;
