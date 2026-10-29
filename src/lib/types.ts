import type { JobStatus, JobType } from "@shared/jobs";

export interface UserSettings {
  clip_pre_seconds: number;
  clip_post_seconds: number;
  video_resolution: "1280x720" | "1920x1080" | "2560x1440";
  video_fps: 30 | 60 | 120;
  retention_days: number;
  auto_download_demos: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  clip_pre_seconds: 4,
  clip_post_seconds: 2,
  video_resolution: "1920x1080",
  video_fps: 60,
  retention_days: 30,
  auto_download_demos: false,
};

export interface MatchRow {
  id: string;
  source: "sharecode" | "demo_upload";
  share_code: string | null;
  valve_match_id: string | null;
  map_name: string | null;
  played_at: string | null;
  duration_seconds: number | null;
  game_mode: string | null;
  score_ct: number | null;
  score_t: number | null;
  score_own: number | null;
  score_enemy: number | null;
  user_side: "CT" | "T" | null;
  result: "win" | "loss" | "tie" | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  headshots: number | null;
  demo_availability: "unknown" | "available" | "expired" | "uploaded" | "missing";
  demo_url: string | null;
  info_source: string | null;
  user_in_demo: boolean | null;
  created_at: string;
}

export interface DemoFileRow {
  id: string;
  match_id: string | null;
  original_name: string;
  size_bytes: number;
  status: "uploading" | "uploaded" | "parsing" | "parsed" | "failed" | "expired";
  error: string | null;
  tickrate: number;
  created_at: string;
}

export interface KillEventRow {
  id: string;
  match_id: string;
  demo_file_id: string;
  round_number: number;
  tick: number;
  seconds_into_round: number | null;
  killer_steam_id64: string | null;
  killer_name: string | null;
  killer_side: string | null;
  victim_steam_id64: string | null;
  victim_name: string | null;
  victim_side: string | null;
  assister_steam_id64?: string | null;
  assister_name: string | null;
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  noscope: boolean;
  through_smoke: boolean;
  attacker_blind: boolean;
  is_user_kill: boolean;
  is_user_death: boolean;
}

export interface RoundRow {
  round_number: number;
  winner: "CT" | "T" | null;
  reason: string | null;
  start_tick: number | null;
  freeze_end_tick: number | null;
  end_tick: number | null;
}

export interface ClipRow {
  id: string;
  match_id: string;
  demo_file_id: string;
  kill_event_id: string | null;
  title: string;
  start_tick: number;
  end_tick: number;
  resolution: string;
  fps: number;
  status: "queued" | "rendering" | "ready" | "failed";
  storage_path: string | null;
  thumbnail_path: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  error: string | null;
  created_at: string;
}

export interface JobRow {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  progress_message: string | null;
  error: string | null;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
