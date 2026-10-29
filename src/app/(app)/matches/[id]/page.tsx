import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clapperboard, FileSearch } from "lucide-react";
import { ClipGallery } from "@/components/clip-gallery";
import { DemoPanel } from "@/components/demo-panel";
import { DemoUpload } from "@/components/demo-upload";
import { KillTimeline } from "@/components/kill-timeline";
import { MapArt } from "@/components/map-art";
import { DemoBadge, ResultBadge, SideBadge } from "@/components/match-badges";
import { MatchScore } from "@/components/match-card";
import { Badge, Card, EmptyState, Notice, SectionTitle } from "@/components/ui/primitives";
import { getMatch, getSettings, JOB_COLUMNS, onlineCapabilities } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { HttpError } from "@/lib/server/http";
import { pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import type { JobRow } from "@/lib/types";
import { formatDate, formatDuration, kd } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Match" };

export default async function MatchPage({ params }: PageProps<"/matches/[id]">) {
  const { id } = await params;
  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  let data;
  try {
    data = await getMatch(db, id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const { match: m, rounds, kills, demos, clips } = data;
  const [settings, online, jobsRes] = await Promise.all([
    getSettings(db),
    onlineCapabilities(db),
    db.from("processing_jobs").select(JOB_COLUMNS).in("status", ["queued", "running", "failed"]).order("created_at", { ascending: false }).limit(30),
  ]);
  const demoIds = new Set(demos.map((d) => d.id));
  const relatedJobs = ((jobsRes.data ?? []) as JobRow[]).filter(
    (j) => (j.type === "parse_demo" && demoIds.has(String(j.payload.demoFileId))) || (j.type === "download_demo" && j.payload.matchId === m.id),
  );
  const parsed = demos.find((d) => d.status === "parsed");
  const tickrate = parsed?.tickrate ?? 64;
  const myKills = kills.filter((k) => k.is_user_kill);

  const statItems = [
    [t("Killlar"), m.kills],
    [t("O'limlar"), m.deaths],
    [t("Yordamlar"), m.assists],
    ["K/D", m.kills != null ? kd(m.kills, m.deaths) : null],
    ["Headshot", m.headshots != null ? `${m.headshots}${m.kills ? ` (${Math.round((m.headshots / m.kills) * 100)}%)` : ""}` : null],
    [t("Davomiylik"), m.duration_seconds != null ? formatDuration(m.duration_seconds, lang) : null],
  ] as const;

  return (
    <div className="space-y-10">
      <Link href="/matches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {t("Matchlar")}
      </Link>

      <section className="panel relative overflow-hidden !rounded-3xl">
        <MapArt map={m.map_name} size="lg" className="h-56 sm:h-64" />
        <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-1.5 sm:right-6 sm:top-6">
          <ResultBadge result={m.result} lang={lang} />
          <SideBadge side={m.user_side} />
          <DemoBadge a={m.demo_availability} lang={lang} />
        </div>
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_1fr] lg:items-center">
          <div>
            <div className="label">{m.score_own != null ? t("Sizning jamoa : raqib") : "CT : T"}</div>
            <MatchScore m={m} className="text-6xl sm:text-7xl" />
            {m.score_ct != null && m.score_t != null && m.score_own != null && (
              <div className="mt-1 font-mono text-xs text-subtle">
                {t("Yakuniy tomonlar")}: <span className="text-ct">CT {m.score_ct}</span> · <span className="text-tside">T {m.score_t}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3 sm:grid-cols-6">
            {statItems.map(([l, v]) => (
              <div key={l} className="rounded-xl border border-line bg-surface-2/60 px-3 py-2.5">
                <div className="label">{l}</div>
                <div className="mt-1 truncate text-xl font-bold tabular-nums">{v ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line px-5 py-3 text-xs text-muted sm:px-7">
          <span>{t("Sana")}: {m.played_at ? formatDate(m.played_at, true, lang) : t("noma'lum")}</span>
          <span>{t("Rejim")}: {m.game_mode ?? t("noma'lum")}</span>
          {m.valve_match_id && <span className="font-mono">Match ID: {m.valve_match_id}</span>}
          {m.share_code && <span className="font-mono">{m.share_code}</span>}
          <span>{t("Manba")}: {m.info_source === "demo" ? t("demo tahlili") : m.info_source === "gc" ? "Valve GC" : m.source === "sharecode" ? t("share code (tafsilot kutilmoqda)") : "demo"}</span>
        </div>
      </section>

      {m.user_in_demo === false && (
        <Notice tone="warn" title={t("Siz bu demoda topilmadingiz")}>
          {t("Demo tahlil qilindi, lekin unda sizning SteamID ({id}) uchramadi. Statistika hisoblanmadi; barcha killlar baribir ko'rsatiladi.", { id: user.steamId64 })}
        </Notice>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <section>
            <SectionTitle eyebrow={t("Raundlar")} title={t("{n} raund", { n: rounds.length || "—" })} />
            {rounds.length ? (
              <div className="flex flex-wrap gap-1.5">
                {rounds.map((r) => {
                  const n = kills.filter((k) => k.round_number === r.round_number && k.is_user_kill).length;
                  return (
                    <div
                      key={r.round_number}
                      title={`R${r.round_number}: ${r.winner ?? "?"} — ${r.reason ?? ""}`}
                      className={`relative flex h-12 w-9 flex-col sm:h-14 sm:w-10 items-center justify-end rounded-lg border pb-1 ${r.winner === "CT" ? "border-ct/30 bg-ct/10" : r.winner === "T" ? "border-tside/30 bg-tside/10" : "border-line bg-surface"}`}
                    >
                      {n > 0 && <span className="absolute top-1 font-mono text-[10px] font-semibold text-neon">{n}K</span>}
                      <span className="font-mono text-[11px] text-muted">{r.round_number}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">{t("Raundlar demo tahlilidan keyin ko'rinadi.")}</p>
            )}
          </section>

          <section>
            <SectionTitle eyebrow={t("Kill eventlar")} title={kills.length ? t("Xronologiya · {n} ta sizning kill", { n: myKills.length }) : t("Xronologiya")} />
            {kills.length ? (
              <KillTimeline
                kills={kills}
                rounds={rounds}
                tickrate={tickrate}
                existingClipKillIds={clips.map((c) => c.kill_event_id).filter(Boolean) as string[]}
                pre={settings.clip_pre_seconds}
                post={settings.clip_post_seconds}
              />
            ) : (
              <EmptyState icon={<FileSearch />} title={t("Kill eventlar yo'q")}>
                {m.source === "sharecode"
                  ? t("Share code faqat matchni aniqlaydi. Killlarni ko'rish uchun shu matchning demo faylini yuklang (yoki Valve serverida bo'lsa — yuklab oling).")
                  : t("Demo tahlili tugashi bilan bu yerda killlar paydo bo'ladi.")}
              </EmptyState>
            )}
          </section>

          <section>
            <SectionTitle eyebrow={t("Shu matchdan")} title={t("Kliplar")} />
            {clips.length ? (
              <ClipGallery clips={clips.map((c) => ({ ...c, matches: { map_name: m.map_name } }))} online={online} renderOnline={Boolean(online.render)} />
            ) : (
              <EmptyState icon={<Clapperboard />} title={t("Clip yaratilmagan")}>
                {t("Xronologiyadan killni tanlang va \"Clip yaratish\" tugmasini bosing.")}
              </EmptyState>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">{t("Demo tahlili holati")}</h3>
              {parsed ? <Badge tone="neon">{t("tayyor")}</Badge> : <Badge>{t("kutilmoqda")}</Badge>}
            </div>
            <DemoPanel match={m} demos={demos} jobs={relatedJobs} online={online} />
            {!demos.some((d) => d.status !== "failed" && d.status !== "expired") && (
              <div className="mt-3">
                <DemoUpload matchId={m.id} maxMb={env().DEMO_MAX_MB} compact online={online} />
              </div>
            )}
          </Card>
          <Notice tone="violet" title={t("Clip qanday yaratiladi")}>
            {t("Kill tick'idan {pre} s oldin va {post} s keyin olinadi (Sozlamalarda o'zgartiriladi). MP4 render Windows render worker'da CS2 + HLAE orqali bajariladi.", { pre: settings.clip_pre_seconds, post: settings.clip_post_seconds })}
          </Notice>
        </aside>
      </div>
    </div>
  );
}
