import Link from "next/link";
import { Suspense } from "react";
import { CloudCheck, CloudUpload, Layers, ListVideo } from "lucide-react";
import { MatchCard, MODE_LABEL, modeOf, type MatchMode } from "@/components/match-card";
import { MapSelect, UploadButton } from "@/components/match-filters";
import { RefreshMatchesButton } from "@/components/refresh-matches";
import { EmptyState } from "@/components/ui/primitives";
import { getT } from "@/lib/i18n/server";
import { getSteamAccount, listActiveJobs, listMatches } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import type { MatchRow } from "@/lib/types";
import { mapMeta } from "@shared/maps";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Matchlar") };
}

type Demo = "all" | "yes" | "no";
const MODES: MatchMode[] = ["premier", "competitive", "wingman", "community"];
const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
const hasDemo = (m: MatchRow) => m.demo_availability === "uploaded";

// Kunlar Toshkent vaqti bo'yicha guruhlanadi
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date(iso));

export default async function MatchesPage({ searchParams }: PageProps<"/matches">) {
  const sp = await searchParams;
  const demo: Demo = sp.demo === "yes" || sp.demo === "no" ? sp.demo : "all";
  const mode = MODES.find((m) => m === sp.mode);
  const map = one(sp.map);

  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  const [all, steam, jobs] = await Promise.all([listMatches(db, {}, 1000), getSteamAccount(db), listActiveJobs(db)]);

  const byDemo = all.filter((m) => demo === "all" || (demo === "yes" ? hasDemo(m) : !hasDemo(m)));
  const byMode = byDemo.filter((m) => !mode || modeOf(m) === mode);
  const shown = byMode.filter((m) => !map || m.map_name === map);
  const maps = [...new Set(all.map((m) => m.map_name).filter(Boolean) as string[])].map((id) => ({ id, name: mapMeta(id).name }));

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const next = { demo: demo === "all" ? undefined : demo, mode, map, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    return `/matches${q.size ? `?${q}` : ""}`;
  };

  const groups: { key: string; items: MatchRow[] }[] = [];
  for (const m of shown) {
    const key = dayKey(m.played_at ?? m.created_at);
    const g = groups.at(-1);
    if (g?.key === key) g.items.push(m);
    else groups.push({ key, items: [m] });
  }
  const dayLabel = (key: string) => {
    const d = new Date(`${key}T12:00:00+05:00`);
    return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "uz-UZ", { day: "numeric", month: "short", timeZone: "Asia/Tashkent" }).format(d);
  };

  const demoTabs: { id: Demo; label: string; icon: typeof Layers; n: number; tone: string }[] = [
    { id: "all", label: "Hammasi", icon: Layers, n: all.length, tone: "" },
    { id: "yes", label: "Yuklangan", icon: CloudCheck, n: all.filter(hasDemo).length, tone: "text-neon" },
    { id: "no", label: "Yuklanmagan", icon: CloudUpload, n: all.filter((m) => !hasDemo(m)).length, tone: "text-tside" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">{t("{n} ta o'yin tahlil qilingan", { n: all.filter(hasDemo).length })}</p>

      <div className="grid grid-cols-2 gap-3">
        <div data-tour="sync">
          <RefreshMatchesButton enabled={steam.history_enabled} initialJobs={jobs} showJobs={false} label="Sinxronlash" className="h-11 w-full rounded-2xl text-sm" />
        </div>
        <div data-tour="upload">
          <UploadButton maxMb={env().DEMO_MAX_MB} className="h-11 w-full rounded-2xl" />
        </div>
      </div>

      <div data-tour="demo-tabs" className="grid grid-cols-3 gap-1 rounded-[1.25rem] bg-surface p-1 shadow-[0_6px_18px_-14px_rgb(16_42_67/0.35)]">
        {demoTabs.map(({ id, label, icon: Icon, n, tone }) => (
          <Link
            key={id}
            href={href({ demo: id === "all" ? undefined : id })}
            scroll={false}
            className={cn("flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[13px] font-semibold transition", demo === id ? "bg-neon text-on-neon shadow-sm" : "text-muted")}
          >
            <span className="flex items-center gap-2">
              <Icon className={cn("size-4", demo !== id && tone)} />
              <span className={cn("grid min-w-5 place-items-center rounded-full px-1.5 text-[11px]", demo === id ? "bg-white/25 text-white" : "bg-fg/10")}>{n}</span>
            </span>
            {t(label)}
          </Link>
        ))}
      </div>

      <div data-tour="modes" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {MODES.map((id) => {
          const n = byDemo.filter((m) => modeOf(m) === id).length;
          const active = mode === id;
          return (
            <Link
              key={id}
              href={href({ mode: active ? undefined : id })}
              scroll={false}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition",
                active ? "border-neon bg-neon text-on-neon" : "border-transparent bg-surface text-fg shadow-[0_4px_14px_-10px_rgb(16_42_67/0.4)]",
              )}
            >
              {t(MODE_LABEL[id])}
              <span className={cn("text-xs font-normal", active ? "text-white/75" : "text-subtle")}>{n}</span>
            </Link>
          );
        })}
      </div>

      <div data-tour="map-select">
        <Suspense>
          <MapSelect maps={maps} />
        </Suspense>
      </div>

      {groups.length ? (
        <div data-tour="match-list" className="space-y-5 pt-1">
          {groups.map((g) => {
            const w = g.items.filter((m) => m.result === "win").length;
            const l = g.items.filter((m) => m.result === "loss").length;
            return (
              <section key={g.key}>
                <div data-tour="day-header" className="mb-2.5 flex items-center justify-between px-1">
                  <h2 className="text-[13px] font-semibold text-muted">{dayLabel(g.key)}</h2>
                  <span className="font-mono text-xs">
                    <span className="text-neon">{w}W</span> <span className="text-subtle">·</span> <span className="text-danger">{l}L</span>
                  </span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {g.items.map((m) => (
                    <MatchCard key={m.id} m={m} lang={lang} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : all.length ? (
        <EmptyState title={t("Hech narsa topilmadi")}>{t("Filtrlarni o'zgartirib ko'ring.")}</EmptyState>
      ) : (
        <EmptyState icon={<ListVideo />} title={t("Matchlar hali yo'q")}>
          {steam.history_enabled
            ? t("Sinxronlash tugmasini bosing yoki demo fayl yuklang.")
            : t("Sozlamalarda match tarixini ulang yoki demo fayl yuklang — matchlar shu yerda chiqadi.")}
        </EmptyState>
      )}
    </div>
  );
}
