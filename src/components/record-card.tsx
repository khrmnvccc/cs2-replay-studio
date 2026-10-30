import Link from "next/link";
import { MapBadge, ModeTag } from "@/components/match-card";
import type { RecordItem } from "@/lib/records";
import { mapMeta } from "@shared/maps";
import { cn } from "@/lib/utils";
import type { Lang, TFn } from "@/lib/i18n";

export function RecordCard({ r, t, lang }: { r: RecordItem; t: TFn; lang: Lang }) {
  const m = r.match;
  const hue = mapMeta(m?.map_name).hue;
  const body = (
    <>
      {/* Xarita rangidagi burchak belgisi */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute -bottom-3 -right-3 size-28 opacity-[0.12]" aria-hidden>
        <path d="M50 4 96 38 78 96H22L4 38Z" fill={m ? `hsl(${hue} 70% 55%)` : "currentColor"} />
      </svg>
      <div className="label !text-[11px] !tracking-[0.12em] !text-muted">{t(r.label)}</div>
      <div className={cn("mt-2 whitespace-nowrap font-display font-bold tabular-nums", (r.value?.length ?? 0) > 5 ? "text-2xl" : "text-3xl")}>{r.value ?? "—"}</div>
      <div className="mt-auto pt-6">
        {m ? (
          <>
            <div className="flex items-center gap-2">
              <MapBadge map={m.map_name} className="size-6 rounded-md text-[9px]" />
              <span className="truncate text-[13px] font-medium">{mapMeta(m.map_name).name}</span>
              {m.score_own != null && (
                <span className={cn("font-mono text-[13px] font-semibold tabular-nums", m.result === "win" ? "text-neon" : m.result === "loss" ? "text-danger" : "text-muted")}>
                  {m.score_own}:{m.score_enemy}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-subtle">{new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "uz-UZ", { day: "numeric", month: "short", timeZone: "Asia/Tashkent" }).format(new Date(m.played_at ?? m.created_at))}</span>
              <ModeTag m={m} className="shrink-0 !border-0 !p-0 !text-[11px] !text-muted" />
            </div>
          </>
        ) : (
          <span className="text-sm text-muted">{t("Hali o'rnatilmagan")}</span>
        )}
      </div>
    </>
  );
  const cls = "panel relative flex min-h-44 flex-col overflow-hidden p-4 transition";
  return m ? (
    <Link data-tour="record-card" href={`/matches/${m.id}`} className={cn(cls, "hover:-translate-y-0.5 active:scale-[0.99]")}>
      {body}
    </Link>
  ) : (
    <div data-tour="record-card" className={cls}>
      {body}
    </div>
  );
}

