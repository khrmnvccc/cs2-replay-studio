import { z } from "zod";
import { authed, HttpError, json, parseBody } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { CLIP_COLUMNS, enqueueJob, getSettings } from "@/lib/server/data";
import { clipWindow } from "@shared/clip";
import type { KillEventRow, RoundRow } from "@/lib/types";

const body = z.object({
  killEventIds: z.array(z.string().uuid()).min(1, "Kamida bitta kill tanlang").max(50, "Bir martada ko'pi bilan 50 ta clip"),
  preSeconds: z.number().min(0).max(30).optional(),
  postSeconds: z.number().min(0).max(30).optional(),
});

// Tanlangan har bir kill uchun clip yaratadi va MP4 render ishini navbatga qo'yadi.
export const POST = authed(async (req, _ctx, user) => {
  const input = await parseBody(req, body);
  const db = await userDb(user.userId);
  const settings = await getSettings(db);
  const { data: kills, error } = await db.from("kill_events").select("*").in("id", input.killEventIds);
  if (error) throw new Error(error.message);
  if (!kills?.length) throw new HttpError(404, "Kill eventlar topilmadi");

  const matchIds = [...new Set(kills.map((k) => k.match_id))];
  const demoIds = [...new Set(kills.map((k) => k.demo_file_id))];
  const [{ data: rounds }, { data: demos }] = await Promise.all([
    db.from("match_rounds").select("match_id, round_number, start_tick, freeze_end_tick, end_tick").in("match_id", matchIds),
    db.from("demo_files").select("id, tickrate, status").in("id", demoIds),
  ]);
  const tickrateOf = new Map((demos ?? []).map((d) => [d.id, d.tickrate as number]));

  const created = [];
  for (const k of kills as KillEventRow[]) {
    const round = (rounds as (RoundRow & { match_id: string })[] | null)?.find((r) => r.match_id === k.match_id && r.round_number === k.round_number);
    const w = clipWindow({
      killTick: k.tick,
      preSeconds: input.preSeconds ?? settings.clip_pre_seconds,
      postSeconds: input.postSeconds ?? settings.clip_post_seconds,
      tickrate: tickrateOf.get(k.demo_file_id) ?? 64,
      roundStartTick: round?.freeze_end_tick ?? round?.start_tick,
      roundEndTick: round?.end_tick,
    });
    const flags = [k.headshot && "HS", k.wallbang && "wallbang", k.noscope && "noscope"].filter(Boolean).join(" ");
    const title = `R${k.round_number} · ${k.killer_name ?? "?"} → ${k.victim_name ?? "?"} (${k.weapon}${flags ? `, ${flags}` : ""})`.slice(0, 120);
    const { data: clip, error: cErr } = await db
      .from("clips")
      .insert({
        user_id: user.userId,
        match_id: k.match_id,
        demo_file_id: k.demo_file_id,
        kill_event_id: k.id,
        title,
        start_tick: w.startTick,
        end_tick: w.endTick,
        pov_steam_id64: k.killer_steam_id64,
        resolution: settings.video_resolution,
        fps: settings.video_fps,
      })
      .select(CLIP_COLUMNS)
      .single();
    if (cErr || !clip) throw new Error(cErr?.message ?? "Clip yaratilmadi");
    const job = await enqueueJob(db, user.userId, "render_clip", { clipId: clip.id }, 2);
    created.push({ clip, job });
  }
  return json({ ok: true, created });
}, { limit: 20 });
