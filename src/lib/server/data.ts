import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobType } from "@shared/jobs";
import { DEFAULT_SETTINGS, type ClipRow, type DemoFileRow, type JobRow, type KillEventRow, type MatchRow, type RoundRow, type UserSettings } from "@/lib/types";
import { after } from "next/server";
import { HttpError } from "./http";
import { wakeCloudWorker } from "./worker-wake";

export const MATCH_COLUMNS =
  "id, source, share_code, valve_match_id, map_name, played_at, duration_seconds, game_mode, score_ct, score_t, score_own, score_enemy, user_side, result, kills, deaths, assists, headshots, demo_availability, demo_url, info_source, user_in_demo, created_at";
export const CLIP_COLUMNS =
  "id, match_id, demo_file_id, kill_event_id, title, start_tick, end_tick, resolution, fps, status, storage_path, thumbnail_path, size_bytes, duration_seconds, error, created_at";
export const JOB_COLUMNS =
  "id, type, status, progress, progress_message, error, attempts, max_attempts, payload, result, created_at, updated_at";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function getSettings(db: SupabaseClient): Promise<UserSettings> {
  const row = check(await db.from("users").select("settings").single()) as { settings: Partial<UserSettings> };
  return { ...DEFAULT_SETTINGS, ...(row?.settings ?? {}) };
}

export async function getSteamAccount(db: SupabaseClient) {
  return check(
    await db
      .from("steam_accounts")
      .select("steam_id64, persona_name, avatar_url, profile_url, country_code, last_share_code, history_enabled, history_last_synced_at, history_last_error, created_at")
      .single(),
  ) as {
    steam_id64: string;
    persona_name: string;
    avatar_url: string | null;
    profile_url: string | null;
    country_code: string | null;
    last_share_code: string | null;
    history_enabled: boolean;
    history_last_synced_at: string | null;
    history_last_error: string | null;
    created_at: string;
  };
}

export interface MatchFilters {
  map?: string;
  result?: "win" | "loss" | "tie";
  from?: string;
  to?: string;
  q?: string;
}

export async function listMatches(db: SupabaseClient, f: MatchFilters = {}, limit = 200): Promise<MatchRow[]> {
  let q = db.from("matches").select(MATCH_COLUMNS).order("played_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(limit);
  if (f.map) q = q.eq("map_name", f.map);
  if (f.result) q = q.eq("result", f.result);
  if (f.from) q = q.gte("played_at", f.from);
  if (f.to) q = q.lte("played_at", `${f.to}T23:59:59Z`);
  if (f.q) {
    const term = f.q.replace(/[%,()*]/g, "").slice(0, 60);
    if (term) q = q.or(`map_name.ilike.%${term}%,share_code.ilike.%${term}%,valve_match_id.ilike.%${term}%`);
  }
  return check(await q) as MatchRow[];
}

export async function getMatch(db: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, "Match topilmadi");
  const match = check(await db.from("matches").select(MATCH_COLUMNS).eq("id", id).maybeSingle()) as MatchRow | null;
  if (!match) throw new HttpError(404, "Match topilmadi");
  const [rounds, kills, demos, clips] = await Promise.all([
    db.from("match_rounds").select("round_number, winner, reason, start_tick, freeze_end_tick, end_tick").eq("match_id", id).order("round_number"),
    db.from("kill_events").select("*").eq("match_id", id).order("tick"),
    db.from("demo_files").select("id, match_id, original_name, size_bytes, status, error, tickrate, created_at").eq("match_id", id).order("created_at", { ascending: false }),
    db.from("clips").select(CLIP_COLUMNS).eq("match_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    match,
    rounds: check(rounds) as RoundRow[],
    kills: check(kills) as KillEventRow[],
    demos: check(demos) as DemoFileRow[],
    clips: check(clips) as ClipRow[],
  };
}

export async function listClips(db: SupabaseClient, sort: "new" | "old" | "name" = "new"): Promise<(ClipRow & { matches: { map_name: string | null } | null })[]> {
  let q = db.from("clips").select(`${CLIP_COLUMNS}, matches(map_name)`);
  q = sort === "name" ? q.order("title") : q.order("created_at", { ascending: sort === "old" });
  return check(await q.limit(500)) as unknown as (ClipRow & { matches: { map_name: string | null } | null })[];
}

export async function listRecentDemos(db: SupabaseClient, limit = 5): Promise<DemoFileRow[]> {
  return check(
    await db.from("demo_files").select("id, match_id, original_name, size_bytes, status, error, tickrate, created_at").order("created_at", { ascending: false }).limit(limit),
  ) as DemoFileRow[];
}

export async function listActiveJobs(db: SupabaseClient): Promise<JobRow[]> {
  return check(
    await db.from("processing_jobs").select(JOB_COLUMNS).in("status", ["queued", "running"]).order("created_at", { ascending: false }).limit(50),
  ) as JobRow[];
}

export async function enqueueJob(db: SupabaseClient, userId: string, type: JobType, payload: Record<string, unknown>, maxAttempts = 3) {
  const row = check(
    await db.from("processing_jobs").insert({ user_id: userId, type, payload, max_attempts: maxAttempts }).select(JOB_COLUMNS).single(),
  ) as JobRow;
  after(wakeCloudWorker);
  return row;
}

export async function onlineCapabilities(db: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await db.rpc("worker_capabilities_online");
  if (error) return {};
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as { capability: string; workers: number }[]) out[r.capability] = r.workers;
  return out;
}

export async function dashboardStats(db: SupabaseClient) {
  const { data, error } = await db.from("matches").select("result, kills, deaths, assists, headshots");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Pick<MatchRow, "result" | "kills" | "deaths" | "assists" | "headshots">[];
  const withStats = rows.filter((r) => r.kills != null);
  const sum = (k: "kills" | "deaths" | "assists" | "headshots") => withStats.reduce((a, r) => a + (r[k] ?? 0), 0);
  const kills = sum("kills");
  const deaths = sum("deaths");
  const decided = rows.filter((r) => r.result);
  return {
    matches: rows.length,
    matchesWithStats: withStats.length,
    wins: rows.filter((r) => r.result === "win").length,
    decided: decided.length,
    kills,
    deaths,
    assists: sum("assists"),
    headshots: sum("headshots"),
    kd: deaths > 0 ? kills / deaths : null,
    hsPercent: kills > 0 ? (sum("headshots") / kills) * 100 : null,
  };
}
