import { authed, json } from "@/lib/server/http";
import { listMatches } from "@/lib/server/data";
import { userDb } from "@/lib/server/supabase";
import { buildRecords, type KillLite } from "@/lib/records";

export type RecordSlide = { id: string; label: string; value: string; matchId: string; map: string | null; at: string; score: string | null; result: string | null };

/** Menyudagi aylanib turadigan rekord kartalari uchun — faqat o'rnatilgan rekordlar. */
export const GET = authed(async (_req, _ctx, user) => {
  const db = await userDb(user.userId);
  const [matches, killsRes] = await Promise.all([
    listMatches(db, {}, 1000),
    db.from("kill_events").select("match_id, round_number, tick, is_user_kill, headshot").limit(50000),
  ]);
  const slides: RecordSlide[] = buildRecords(matches, (killsRes.data ?? []) as KillLite[]).flatMap((r) =>
    r.value != null && r.match
      ? [
          {
            id: r.id,
            label: r.label,
            value: r.value,
            matchId: r.match.id,
            map: r.match.map_name,
            at: r.match.played_at ?? r.match.created_at,
            score: r.match.score_own != null ? `${r.match.score_own}:${r.match.score_enemy}` : null,
            result: r.match.result,
          },
        ]
      : [],
  );
  return json({ records: slides });
}, { limit: 60 });
