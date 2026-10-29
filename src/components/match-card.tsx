import Link from "next/link";
import { MapArt } from "@/components/map-art";
import { makeT, type Lang } from "@/lib/i18n";
import type { MatchRow } from "@/lib/types";
import { mapMeta } from "@shared/maps";
import { cn, kd } from "@/lib/utils";

export type MatchMode = "premier" | "competitive" | "wingman" | "community";

/** Rejim: GC/demo bergan matndan. Share code bilan kelgan matchmaking — competitive. */
export function modeOf(m: Pick<MatchRow, "game_mode">): MatchMode {
  const g = (m.game_mode ?? "").toLowerCase();
  if (g === "premier") return "premier";
  if (g.includes("wingman")) return "wingman";
  if (!g || g.includes("competitive") || g === "matchmaking") return "competitive";
  return "community";
}

export const MODE_LABEL: Record<MatchMode, string> = { premier: "Premier", competitive: "Competitive", wingman: "Wingman", community: "Komuniti" };

export function ModeTag({ m, className }: { m: Pick<MatchRow, "game_mode">; className?: string }) {
  const mode = modeOf(m);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider",
        mode === "premier" ? "border-fuchsia-400/60 text-fuchsia-300" : mode === "competitive" ? "border-amber-300/70 text-amber-200" : "border-white/40 text-white/80",
        className,
      )}
    >
      {MODE_LABEL[mode]}
    </span>
  );
}

/** Xarita belgisi: rasmiy emblema o'rniga xarita rangidagi "nishon". */
export function MapBadge({ map, className }: { map: string | null; className?: string }) {
  const m = mapMeta(map);
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl text-[13px] font-black uppercase text-white shadow-md ring-1 ring-white/25", className)}
      style={{ background: `linear-gradient(145deg, hsl(${m.hue} 70% 52%), hsl(${(m.hue + 25) % 360} 65% 32%))` }}
      aria-hidden
    >
      {m.name.slice(0, 2)}
    </span>
  );
}

export function scoreTone(m: Pick<MatchRow, "result">) {
  return m.result === "win" ? "text-neon" : m.result === "loss" ? "text-danger" : "text-white";
}

export function kdTone(v: number | null) {
  if (v == null) return "text-white/60";
  return v >= 1.2 ? "text-violet-300" : v >= 1 ? "text-neon" : v >= 0.8 ? "text-amber-300" : "text-danger";
}

const time = (iso: string) => new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }).format(new Date(iso));

export function MatchCard({ m, lang = "uz" }: { m: MatchRow; lang?: Lang }) {
  const t = makeT(lang);
  const hasScore = m.score_own != null && m.score_enemy != null;
  const ratio = m.kills != null && m.deaths != null ? (m.deaths ? m.kills / m.deaths : m.kills) : null;
  const when = m.played_at ?? m.created_at;
  return (
    <Link
      href={`/matches/${m.id}`}
      className="group relative block overflow-hidden rounded-[1.5rem] bg-[#121722] text-white shadow-[0_14px_30px_-18px_rgb(0_0_0/0.6)] transition active:scale-[0.99]"
    >
      <MapArt map={m.map_name} label={false} className="absolute inset-0 opacity-60 transition duration-500 group-hover:scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f17]/95 via-[#0b0f17]/70 to-[#0b0f17]/40" />
      <span className={cn("absolute inset-y-0 left-0 w-1.5", m.result === "win" ? "bg-neon" : m.result === "loss" ? "bg-danger" : "bg-white/25")} />
      <div className="relative flex items-center gap-3.5 p-4 pl-5">
        <MapBadge map={m.map_name} className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-lg font-bold">{mapMeta(m.map_name).name}</span>
            <ModeTag m={m} />
          </div>
          <div className="mt-0.5 text-sm text-white/70">{m.played_at ? time(when) : m.source === "demo_upload" ? t("Yuklangan demo") : t("Sana aniqlanmoqda")}</div>
        </div>
        <div className={cn("font-display text-3xl font-bold tabular-nums", scoreTone(m))}>{hasScore ? `${m.score_own} : ${m.score_enemy}` : "– : –"}</div>
      </div>
      <div className="relative mx-5 border-t border-white/10" />
      <div className="relative flex items-center justify-between px-5 py-3 font-mono text-sm">
        <span className="text-white/80">{m.kills != null ? `${m.kills} / ${m.deaths ?? 0} / ${m.assists ?? 0}` : t("Demo tahlil qilinmagan")}</span>
        <span className={cn("font-semibold", kdTone(ratio))}>{ratio != null ? kd(m.kills, m.deaths) : ""}</span>
      </div>
    </Link>
  );
}
