import { z } from "zod";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { env } from "@/lib/server/env";
import { adminDb, userDb } from "@/lib/server/supabase";
import { startHistorySync } from "@/lib/server/history-sync";
import { getNextMatchSharingCode } from "@/lib/steam/web-api";
import { decodeShareCode, isValidShareCode } from "@shared/sharecode";
import { AUTH_CODE_RE } from "@shared/steamid";
import { encryptSecret } from "@shared/secret-box";

const body = z.object({
  authCode: z.string().trim().toUpperCase().regex(AUTH_CODE_RE, "Authentication code formati: XXXX-XXXXX-XXXX"),
  shareCode: z.string().trim().refine(isValidShareCode, "Share code formati: CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"),
});

// Match tarixini ulash: Steam "Game Authentication Code" + oxirgi match share code.
export const POST = authed(async (req, _ctx, user) => {
  const { authCode, shareCode } = await parseBody(req, body);
  const e = env();
  if (!e.STEAM_API_KEY) throw new HttpError(503, "Match tarixi uchun serverda STEAM_API_KEY sozlanmagan. Sayt egasi uni qo'shishi kerak.");
  // Kodlarni Valve'da haqiqatan tekshiramiz — noto'g'ri bo'lsa saqlamaymiz.
  const check = await getNextMatchSharingCode(e.STEAM_API_KEY, user.steamId64, authCode, shareCode);
  if (check.kind === "invalid_auth") throw new HttpError(400, "Steam authentication code noto'g'ri yoki bu akkauntga tegishli emas");
  if (check.kind === "invalid_known_code") throw new HttpError(400, "Share code bu akkauntning matchiga tegishli emas");

  const { error } = await adminDb()
    .from("steam_accounts")
    .update({
      auth_code_encrypted: encryptSecret(authCode, e.APP_ENCRYPTION_KEY),
      last_share_code: shareCode,
      history_enabled: true,
      history_last_error: null,
    })
    .eq("user_id", user.userId);
  if (error) throw new Error(error.message);

  const db = await userDb(user.userId);
  const d = decodeShareCode(shareCode);
  await db.from("matches").upsert(
    {
      user_id: user.userId,
      source: "sharecode",
      share_code: shareCode,
      valve_match_id: d.matchId,
      valve_outcome_id: d.outcomeId,
      valve_token: String(d.token),
      game_mode: "Matchmaking",
    },
    { onConflict: "user_id,share_code", ignoreDuplicates: true },
  );
  const job = await startHistorySync(db, user.userId);
  return json({ ok: true, job });
}, { limit: 10 });

export const DELETE = authed(async (_req, _ctx, user) => {
  const { error } = await adminDb()
    .from("steam_accounts")
    .update({ auth_code_encrypted: null, history_enabled: false })
    .eq("user_id", user.userId);
  if (error) throw new Error(error.message);
  return json({ ok: true });
});
