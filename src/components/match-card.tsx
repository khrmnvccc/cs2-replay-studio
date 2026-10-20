import Link from "next/link";
import { Crosshair, Hash, Timer } from "lucide-react";
import { MapArt } from "@/components/map-art";
import { DemoBadge, ResultBadge, SideBadge } from "@/components/match-badges";
import type { MatchRow } from "@/lib/types";
import { cn, formatDate, formatDuration, kd } from "@/lib/utils";

export function MatchScore({ m, className }: { m: MatchRow; className?: string }) {
  if (m.score_own != null && m.score_enemy != null) {
    return (
      <span className={cn("font-display font-bold tabular-nums", className)}>
        <span className={m.result === "win" ? "text-neon" : m.result === "loss" ? "text-danger" : "text-fg"}>{m.score_own}</span>
        <span className="mx-1 text-subtle">:</span>
        <span className="text-fg/80">{m.score_enemy}</span>
      </span>
    );
  }
  if (m.score_ct != null && m.score_t != null) {
    return (
      <span className={cn("font-display font-bold tabular-nums", className)}>
        <span className="text-ct">{m.score_ct}</span>
        <span className="mx-1 text-subtle">:</span>
        <span className="text-tside">{m.score_t}</span>
      </span>
    );
  }
  return <span className={cn("font-display font-bold text-subtle", className)}>– : –</span>;
}

export function MatchCard({ m }: { m: MatchRow }) {
  const hasStats = m.kills != null;
  return (
    <Link
      href={`/matches/${m.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]"
    >
      <MapArt map={m.map_name} className="h-28 transition duration-500 group-hover:scale-[1.03]" />
      <div className="absolute right-3 top-3 flex gap-1.5">
        <ResultBadge result={m.result} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <MatchScore m={m} className="text-3xl" />
          <SideBadge side={m.user_side} />
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["K", m.kills],
            ["D", m.deaths],
            ["A", m.assists],
            ["K/D", hasStats ? kd(m.kills, m.deaths) : null],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-lg bg-white/[0.03] py-1.5">
              <div className="font-mono text-[10px] text-subtle">{l}</div>
              <div className="font-mono text-sm tabular-nums">{v ?? "—"}</div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{m.played_at ? formatDate(m.played_at) : m.source === "demo_upload" ? `Yuklangan: ${formatDate(m.created_at, false)}` : "Sana: GC kutilmoqda"}</span>
          {m.duration_seconds != null && (
            <span className="inline-flex items-center gap-1">
              <Timer className="size-3" />
              {formatDuration(m.duration_seconds)}
            </span>
          )}
          {m.headshots != null && (
            <span className="inline-flex items-center gap-1">
              <Crosshair className="size-3" />
              {m.headshots} HS
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
          <DemoBadge a={m.demo_availability} />
          {m.valve_match_id && (
            <span className="inline-flex items-center gap-1 truncate font-mono text-[10px] text-subtle" title={m.valve_match_id}>
              <Hash className="size-3" />
              {m.valve_match_id.slice(-8)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
