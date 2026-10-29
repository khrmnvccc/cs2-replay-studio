import "server-only";
import { env } from "./env";

/** Bir nechta o'yinchining Steam avatarlari (bitta so'rov, 1 kun keshlanadi). Kalit bo'lmasa — bo'sh. */
export async function steamAvatars(ids: string[]): Promise<Record<string, string>> {
  const key = env().STEAM_API_KEY;
  const list = [...new Set(ids.filter((id) => /^\d{17}$/.test(id)))].slice(0, 100);
  if (!key || !list.length) return {};
  try {
    const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(key)}&steamids=${list.join(",")}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as { response?: { players?: { steamid: string; avatarmedium?: string }[] } };
    return Object.fromEntries((json.response?.players ?? []).filter((p) => p.avatarmedium).map((p) => [p.steamid, p.avatarmedium!]));
  } catch {
    return {};
  }
}
