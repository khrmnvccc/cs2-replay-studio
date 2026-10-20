export const JOB_TYPES = ["sync_matches", "fetch_match_info", "download_demo", "parse_demo", "render_clip", "zip_clips"] as const;
export type JobType = (typeof JOB_TYPES)[number];
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

/** Worker qobiliyatlari: qaysi worker qaysi ishni bajara oladi */
export const CAPABILITY_FOR_JOB: Record<JobType, string> = {
  sync_matches: "sync",
  fetch_match_info: "gc",
  download_demo: "sync",
  parse_demo: "parse",
  render_clip: "render",
  zip_clips: "zip",
};

export const JOB_LABELS_UZ: Record<JobType, string> = {
  sync_matches: "Match tarixini yangilash",
  fetch_match_info: "Match ma'lumotini Valve GC dan olish",
  download_demo: "Demo'ni Valve serveridan yuklab olish",
  parse_demo: "Demo tahlili",
  render_clip: "MP4 render",
  zip_clips: "ZIP arxiv",
};
