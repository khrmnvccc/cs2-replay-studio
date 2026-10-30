import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { RefreshMatchesButton } from "@/components/refresh-matches";
import { MapBadge } from "@/components/match-card";
import { Badge, EmptyState, Notice, SectionTitle, Stat } from "@/components/ui/primitives";
import { getT } from "@/lib/i18n/server";
import { dashboardStats, getSteamAccount, listActiveJobs, listMatches, onlineCapabilities } from "@/lib/server/data";
import { isOwner, pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import { mapMeta } from "@shared/maps";
import { cn, formatDate } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Statistika") };
}

export default async function StatsPage() {
  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  const [steam, stats, matches, jobs, online] = await Promise.all([getSteamAccount(db), dashboardStats(db), listMatches(db, {}, 1000), listActiveJobs(db), onlineCapabilities(db)]);
  const owner = isOwner(user);

  // Xaritalar bo'yicha: o'yinlar, g'alaba foizi, K/D
  const byMap = new Map<string, { n: number; w: number; decided: number; k: number; d: number }>();
  for (const m of matches) {
    if (!m.map_name) continue;
    const r = byMap.get(m.map_name) ?? { n: 0, w: 0, decided: 0, k: 0, d: 0 };
    r.n++;
    if (m.result) r.decided++;
    if (m.result === "win") r.w++;
    r.k += m.kills ?? 0;
    r.d += m.deaths ?? 0;
    byMap.set(m.map_name, r);
  }
  const maps = [...byMap.entries()].sort((a, b) => b[1].n - a[1].n);

  return (
    <div className="space-y-8">
      <section data-tour="stats-profile" className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        {steam.avatar_url ? (
          <Image src={steam.avatar_url} alt="" width={72} height={72} className="size-[72px] rounded-2xl" unoptimized />
        ) : (
          <div className="size-[72px] rounded-2xl bg-surface-3" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-extrabold tracking-tight">{steam.persona_name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            {steam.profile_url && (
              <a href={steam.profile_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-neon">
                {t("Steam profil")} <ExternalLink className="size-3" />
              </a>
            )}
            {steam.history_enabled ? <Badge tone="neon">{t("Match tarixi ulangan")}</Badge> : <Badge tone="warn">{t("Match tarixi ulanmagan")}</Badge>}
            {steam.history_last_synced_at && (
              <span>
                {t("Oxirgi yangilanish")}: {formatDate(steam.history_last_synced_at, true, lang)}
              </span>
            )}
          </div>
        </div>
        <div data-tour="stats-refresh">
          <RefreshMatchesButton enabled={steam.history_enabled} initialJobs={jobs} online={owner ? online : undefined} />
        </div>
      </section>

      {steam.history_last_error && (
        <Notice tone="danger" title={t("Match tarixini yangilab bo'lmadi")}>
          {t(steam.history_last_error)}.{" "}
          <Link className="underline" href="/settings#history">
            {t("Sozlamalar")}
          </Link>{" "}
          {t("bo'limida qayta ulang.")}
        </Notice>
      )}

      <section>
        <SectionTitle title={t("Sizning ko'rsatkichlaringiz")} />
        <div data-tour="stats-grid" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={t("Matchlar")} value={stats.matches} sub={stats.matches ? t("{n} tasida to'liq statistika", { n: stats.matchesWithStats }) : t("Hali match yo'q")} />
          <Stat
            label={t("G'alaba")}
            value={stats.decided ? `${Math.round((stats.wins / stats.decided) * 100)}%` : "—"}
            sub={stats.decided ? t("{w} / {d} match", { w: stats.wins, d: stats.decided }) : t("Natijali match yo'q")}
            accent
          />
          <Stat
            label="K/D"
            value={stats.kd != null ? stats.kd.toFixed(2) : "—"}
            sub={stats.kills ? t("{k} kill · {d} o'lim · {a} yordam", { k: stats.kills, d: stats.deaths, a: stats.assists }) : t("Statistika tahlil qilingan matchlardan")}
          />
          <Stat label="Headshot" value={stats.hsPercent != null ? `${stats.hsPercent.toFixed(0)}%` : "—"} sub={stats.headshots ? t("{n} ta headshot", { n: stats.headshots }) : "—"} />
        </div>
      </section>

      <section data-tour="stats-maps">
        <SectionTitle title={t("Xaritalar bo'yicha")} />
        {maps.length ? (
          <div className="panel divide-y divide-line overflow-hidden">
            {maps.map(([map, r]) => {
              const wr = r.decided ? Math.round((r.w / r.decided) * 100) : null;
              return (
                <div key={map} className="flex items-center gap-3 px-4 py-3">
                  <MapBadge map={map} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{mapMeta(map).name}</div>
                    <div className="text-xs text-muted">{t("{n} ta o'yin", { n: r.n })}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-mono text-sm font-semibold tabular-nums", wr == null ? "text-subtle" : wr >= 50 ? "text-neon" : "text-danger")}>{wr == null ? "—" : `${wr}%`}</div>
                    <div className="font-mono text-[11px] text-subtle">K/D {r.d ? (r.k / r.d).toFixed(2) : "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title={t("Hali match yo'q")}>{t("Matchlar tahlil qilingach, shu yerda xaritalar bo'yicha natijalaringiz chiqadi.")}</EmptyState>
        )}
      </section>
    </div>
  );
}
