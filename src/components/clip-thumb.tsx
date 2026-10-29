import { AlertTriangle, Clock, Loader2, Play } from "lucide-react";
import { MapArt } from "@/components/map-art";
import type { ClipRow } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";
import { makeT, type Lang } from "@/lib/i18n";

export function ClipThumb({ clip, className, onClick, lang = "uz" }: { clip: ClipRow & { matches?: { map_name: string | null } | null }; className?: string; onClick?: () => void; lang?: Lang }) {
  const t = makeT(lang);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-surface-2", className)} onClick={onClick}>
      {clip.status === "ready" && clip.thumbnail_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/clips/${clip.id}/download?thumb=1`} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <MapArt map={clip.matches?.map_name ?? null} size="sm" className="h-full w-full opacity-70" />
      )}
      <div className="absolute inset-0 grid place-items-center">
        {clip.status === "ready" && (
          <span className="grid size-11 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur transition group-hover:scale-110">
            <Play className="ml-0.5 size-5" fill="currentColor" />
          </span>
        )}
        {clip.status === "queued" && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-muted backdrop-blur">
            <Clock className="size-3.5" /> {t("Render navbatida")}
          </span>
        )}
        {clip.status === "rendering" && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-neon backdrop-blur">
            <Loader2 className="size-3.5 animate-spin" /> {t("Render qilinmoqda")}
          </span>
        )}
        {clip.status === "failed" && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-danger backdrop-blur">
            <AlertTriangle className="size-3.5" /> {t("Render xatosi")}
          </span>
        )}
      </div>
      {clip.duration_seconds != null && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px]">{formatDuration(clip.duration_seconds)}</span>
      )}
    </div>
  );
}
