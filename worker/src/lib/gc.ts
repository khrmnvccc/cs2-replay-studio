// Valve Game Coordinator klienti (steam-user + globaloffensive, DoctorMcKay).
// Share code bo'yicha match tafsilotlarini va demo (replay) URL'ini olish uchun
// alohida Steam bot akkaunt kerak (CS2 litsenziyasi bo'lgan, Steam Guard yoqilgan).
import SteamUser from "steam-user";
import GlobalOffensive from "globaloffensive";
import SteamTotp from "steam-totp";
import type { Config } from "../config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let csgo: any = null;
let ready: Promise<void> | null = null;

function connect(c: Config): Promise<void> {
  if (ready) return ready;
  client = new SteamUser({ autoRelogin: true });
  csgo = new GlobalOffensive(client);
  ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("GC ga ulanish vaqti tugadi (60s)")), 60_000);
    client!.on("error", (e: Error) => {
      clearTimeout(timer);
      ready = null;
      reject(new Error(`Steam bot login xatosi: ${e.message}`));
    });
    client!.on("loggedOn", () => {
      client!.setPersona(SteamUser.EPersonaState.Invisible);
      client!.gamesPlayed([730]);
    });
    csgo!.on("connectedToGC", () => {
      clearTimeout(timer);
      resolve();
    });
    csgo!.on("disconnectedFromGC", () => {
      ready = null;
    });
    if (c.STEAM_BOT_REFRESH_TOKEN) {
      client!.logOn({ refreshToken: c.STEAM_BOT_REFRESH_TOKEN });
    } else {
      client!.logOn({
        accountName: c.STEAM_BOT_USERNAME!,
        password: c.STEAM_BOT_PASSWORD!,
        twoFactorCode: c.STEAM_BOT_SHARED_SECRET ? SteamTotp.generateAuthCode(c.STEAM_BOT_SHARED_SECRET) : undefined,
      });
    }
  });
  return ready;
}

export interface GcMatchInfo {
  matchTime: number | null;
  accountIds: number[];
  kills: number[];
  deaths: number[];
  assists: number[];
  headshots: number[];
  teamScores: number[];
  durationSeconds: number | null;
  demoUrl: string | null;
}

// protobuf obyektida maydonlar snake_case yoki camelCase bo'lishi mumkin
const pick = (o: Record<string, unknown> | undefined, ...keys: string[]) => {
  for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};
const nums = (v: unknown) => (Array.isArray(v) ? v.map(Number) : []);

export async function requestMatchInfo(c: Config, shareCode: string, matchId: string): Promise<GcMatchInfo | null> {
  await connect(c);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      csgo!.removeListener("matchList", onList);
      reject(new Error("GC javob bermadi (30s). Keyinroq qayta urinib ko'ring."));
    }, 30_000);
    const onList = (matches: Array<Record<string, unknown>>) => {
      const m = matches.find((x) => String(pick(x, "matchid", "matchId")) === matchId);
      if (!m) return;
      clearTimeout(timer);
      csgo!.removeListener("matchList", onList);
      const all = (pick(m, "roundstatsall", "roundstatsAll") as Array<Record<string, unknown>>) ?? [];
      const last = all.at(-1) ?? (pick(m, "roundstats_legacy", "roundstatsLegacy") as Record<string, unknown> | undefined);
      if (!last) return resolve(null);
      const reservation = pick(last, "reservation") as Record<string, unknown> | undefined;
      const map = pick(last, "map");
      resolve({
        matchTime: Number(pick(m, "matchtime", "matchTime")) || null,
        accountIds: nums(pick(reservation, "account_ids", "accountIds")),
        kills: nums(pick(last, "kills")),
        deaths: nums(pick(last, "deaths")),
        assists: nums(pick(last, "assists")),
        headshots: nums(pick(last, "enemy_headshots", "enemyHeadshots")),
        teamScores: nums(pick(last, "team_scores", "teamScores")),
        durationSeconds: Number(pick(last, "match_duration", "matchDuration")) || null,
        demoUrl: typeof map === "string" && /^https?:\/\/replay\d+\.valve\.net\//.test(map) ? map : null,
      });
    };
    csgo!.on("matchList", onList);
    csgo!.requestGame(shareCode);
  });
}

export function disconnectGc() {
  client?.logOff();
}
