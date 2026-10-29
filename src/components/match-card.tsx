import Link from "next/link";
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
        mode === "premier" ? "border-fuchsia-500/50 text-fuchsia-600" : mode === "competitive" ? "border-amber/60 text-[#b4570a]" : "border-line-strong text-muted",
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
  return m.result === "win" ? "text-neon" : m.result === "loss" ? "text-danger" : "text-fg";
}

export function kdTone(v: number | null) {
  if (v == null) return "text-subtle";
  return v >= 1.2 ? "text-violet-600" : v >= 1 ? "text-neon" : v >= 0.8 ? "text-[#b4570a]" : "text-danger";
}

const time = (iso: string) => new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }).format(new Date(iso));

/** Xarita rangidagi rangli karta foni (Laylak "reys" kartalari uslubida). */
export function mapGradient(map: string | null) {
  const h = mapMeta(map).hue;
  return `linear-gradient(135deg, hsl(${h} 58% 47%) 0%, hsl(${(h + 12) % 360} 62% 33%) 100%)`;
}

export function CardWatermark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("pointer-events-none absolute opacity-[0.14]", className)} aria-hidden>
      <path d="M50 4 96 38 78 96H22L4 38Z" fill="white" />
      <circle cx="50" cy="52" r="16" fill="none" stroke="white" strokeWidth="5" />
    </svg>
  );
}

export function MatchCard({ m, lang = "uz" }: { m: MatchRow; lang?: Lang }) {
  const t = makeT(lang);
  const hasScore = m.score_own != null && m.score_enemy != null;
  const ratio = m.kills != null && m.deaths != null ? (m.deaths ? m.kills / m.deaths : m.kills) : null;
  return (
    <Link
      href={`/matches/${m.id}`}
      className="group relative block overflow-hidden rounded-[1.5rem] text-white shadow-[0_14px_30px_-18px_rgb(16_42_67/0.55)] transition active:scale-[0.99]"
      style={{ background: mapGradient(m.map_name) }}
    >
      <CardWatermark className="-right-6 -top-4 size-36 transition duration-500 group-hover:rotate-6" />
      <div className="relative flex items-start gap-3 p-4 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[17px] font-extrabold tracking-tight">{mapMeta(m.map_name).name}</span>
            <ModeTag m={m} className="border-white/60 text-white" />
          </div>
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
            {m.played_at ? time(m.played_at) : m.source === "demo_upload" ? t("Yuklangan demo") : t("Sana aniqlanmoqda")}
          </div>
        </div>
        {m.result && (
          <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            {t(m.result === "win" ? "G'alaba" : m.result === "loss" ? "Mag'lubiyat" : "Durang")}
          </span>
        )}
      </div>
      <div className="relative flex items-end justify-between px-4 pb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/65">{t("Hisob")}</div>
          <div className="font-display text-[28px] font-extrabold tabular-nums leading-none">{hasScore ? `${m.score_own} : ${m.score_enemy}` : "– : –"}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/65">K / D / A</div>
          <div className="font-mono text-[15px] font-semibold">{m.kills != null ? `${m.kills} / ${m.deaths ?? 0} / ${m.assists ?? 0}` : "—"}</div>
          {ratio != null && <div className="text-[11px] font-semibold text-white/80">K/D {kd(m.kills, m.deaths)}</div>}
        </div>
      </div>
    </Link>
  );
}
