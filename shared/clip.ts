export const DEFAULT_TICKRATE = 64;

export interface ClipWindowInput {
  killTick: number;
  preSeconds: number;
  postSeconds: number;
  tickrate?: number;
  /** raund chegaralari ma'lum bo'lsa, clip ulardan chiqmaydi */
  roundStartTick?: number | null;
  roundEndTick?: number | null;
}

export function clipWindow({ killTick, preSeconds, postSeconds, tickrate = DEFAULT_TICKRATE, roundStartTick, roundEndTick }: ClipWindowInput) {
  const pre = Math.max(0, Math.min(30, preSeconds));
  const post = Math.max(0, Math.min(30, postSeconds));
  let start = Math.round(killTick - pre * tickrate);
  let end = Math.round(killTick + post * tickrate);
  if (roundStartTick != null) start = Math.max(start, roundStartTick);
  // raund tugagandan keyin ham ~5 soniya o'yin davom etadi, shuning uchun kesmaymiz
  if (roundEndTick != null) end = Math.min(end, roundEndTick + 5 * tickrate);
  start = Math.max(1, start);
  if (end <= start) end = start + tickrate;
  return { startTick: start, endTick: end, durationSeconds: (end - start) / tickrate };
}

export function formatTickTime(tick: number, tickrate = DEFAULT_TICKRATE): string {
  const total = Math.max(0, Math.floor(tick / tickrate));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
