import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clapperboard, FileSearch, History, Swords } from "lucide-react";
import { ClipGallery } from "@/components/clip-gallery";
import { DemoPanel } from "@/components/demo-panel";
import { DemoUpload } from "@/components/demo-upload";
import { KillTimeline } from "@/components/kill-timeline";
import { CardWatermark, MapBadge, ModeTag, mapGradient } from "@/components/match-card";
import { MatchView } from "@/components/match-view";
import { Scoreboard } from "@/components/scoreboard";
import { EmptyState, Notice, SectionTitle } from "@/components/ui/primitives";
import { getMatch, getSettings, JOB_COLUMNS, onlineCapabilities } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { HttpError } from "@/lib/server/http";
import { isOwner, pageUser } from "@/lib/server/session";
import { steamAvatars } from "@/lib/server/steam-avatars";
import { userDb } from "@/lib/server/supabase";
import { buildScoreboard, roundCount, sideInRound, type Side } from "@/lib/scoreboard";
import type { JobRow } from "@/lib/types";
import { mapMeta } from "@shared/maps";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Match" };

function Soon({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="panel grid place-items-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-neon/10 text-neon [&_svg]:size-7">{icon}</span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
    </div>
  );
}

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
  const board = buildScoreboard(kills, user.steamId64);
  const [settings, online, jobsRes, avatars] = await Promise.all([
    getSettings(db),
    onlineCapabilities(db),
    db.from("processing_jobs").select(JOB_COLUMNS).in("status", ["queued", "running", "failed"]).order("created_at", { ascending: false }).limit(30),
    steamAvatars(board.rows.map((r) => r.steamId ?? "")),
  ]);
  const owner = isOwner(user);
  const demoIds = new Set(demos.map((d) => d.id));
  const relatedJobs = ((jobsRes.data ?? []) as JobRow[]).filter(
    (j) => (j.type === "parse_demo" && demoIds.has(String(j.payload.demoFileId))) || (j.type === "download_demo" && j.payload.matchId === m.id),
  );
  const parsed = demos.find((d) => d.status === "parsed");
  const tickrate = parsed?.tickrate ?? 64;

  // Jamoa hisobi: foydalanuvchi demoda bo'lsa — o'z/raqib, aks holda raund g'oliblaridan
  const startA: Side = board.userStart ?? "CT";
  const fromRounds = (team: "A" | "B") => rounds.filter((r) => r.winner && (r.winner === sideInRound(startA, r.round_number)) === (team === "A")).length;
  const scoreA = m.score_own ?? (rounds.length ? fromRounds("A") : null);
  const scoreB = m.score_enemy ?? (rounds.length ? fromRounds("B") : null);
  const totalRounds = roundCount(rounds, scoreA, scoreB);
  const result = m.result ?? (scoreA != null && scoreB != null ? (scoreA > scoreB ? "win" : scoreA < scoreB ? "loss" : "tie") : null);

  const noDemoText =
    m.source === "sharecode"
      ? t("Bu match uchun demo hali tahlil qilinmagan. «Demo» bo'limidan demo faylni yuklang.")
      : t("Demo tahlili tugashi bilan bu yerda ma'lumotlar paydo bo'ladi.");

  const panels = {
    board: kills.length ? (
      <Scoreboard rows={board.rows} rounds={totalRounds} scoreA={scoreA} scoreB={scoreB} avatars={avatars} hasUser={Boolean(board.userStart)} t={t} />
    ) : (
      <EmptyState icon={<FileSearch />} title={t("Hisob jadvali yo'q")}>
        {noDemoText}
      </EmptyState>
    ),
    rounds: rounds.length ? (
      <div className="panel p-4">
        <div className="mb-3 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-neon" /> {t("Yutilgan raund")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-danger" /> {t("Boy berilgan raund")}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {rounds.map((r) => {
            const mine = kills.filter((k) => k.round_number === r.round_number && k.is_user_kill).length;
            const won = r.winner ? r.winner === sideInRound(startA, r.round_number) : null;
            return (
              <div
                key={r.round_number}
                title={`R${r.round_number}: ${r.winner ?? "?"} — ${r.reason ?? ""}`}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-end rounded-xl border pb-1.5",
                  won === true ? "border-neon/30 bg-neon/10" : won === false ? "border-danger/30 bg-danger/10" : "border-line bg-surface-2",
                )}
              >
                {mine > 0 && <span className="absolute top-1.5 font-mono text-[10px] font-bold text-neon">{mine}K</span>}
                <span className="font-mono text-xs text-muted">{r.round_number}</span>
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      <EmptyState icon={<FileSearch />} title={t("Raundlar yo'q")}>
        {noDemoText}
      </EmptyState>
    ),
    kills: (
      <div className="space-y-8">
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
            {noDemoText}
          </EmptyState>
        )}
        <section>
          <SectionTitle title={t("Shu matchdan kliplar")} />
          {clips.length ? (
            <ClipGallery clips={clips.map((c) => ({ ...c, matches: { map_name: m.map_name } }))} online={owner ? online : undefined} renderOnline={Boolean(online.render)} />
          ) : (
            <EmptyState icon={<Clapperboard />} title={t("Clip yaratilmagan")}>
              {t("Yuqoridan killni tanlang va \"Clip yaratish\" tugmasini bosing.")}
            </EmptyState>
          )}
        </section>
      </div>
    ),
    replay: <Soon icon={<History />} title={t("Takror — tez orada")} text={t("Raundlarni xaritada 2D ko'rinishda qayta ko'rish.")} />,
    clutch: <Soon icon={<Swords />} title={t("Klatchlar — tez orada")} text={t("1 ga 2, 1 ga 3 kabi vaziyatlaringiz va ularning natijasi.")} />,
    demo: (
      <div className="panel space-y-3 p-4">
        <DemoPanel match={m} demos={demos} jobs={relatedJobs} online={owner ? online : {}} />
        {!demos.some((d) => d.status !== "failed" && d.status !== "expired") && <DemoUpload matchId={m.id} maxMb={env().DEMO_MAX_MB} compact />}
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <section data-tour="match-hero" className="relative overflow-hidden rounded-[1.75rem] text-white shadow-[0_18px_40px_-22px_rgb(16_42_67/0.6)]" style={{ background: mapGradient(m.map_name) }}>
        <CardWatermark className="-right-10 -top-8 size-64" />
        <div className="relative px-4 pb-6 pt-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/matches" className="grid size-11 place-items-center rounded-full bg-white/20" aria-label={t("Matchlar")}>
              <ArrowLeft className="size-5" />
            </Link>
            <ModeTag m={m} className="border-white/60 px-2.5 py-1 text-xs text-white" />
            <span className="text-[15px] font-semibold text-white/90">{m.played_at ? formatDate(m.played_at, false, lang) : m.source === "demo_upload" ? t("Yuklangan demo") : ""}</span>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="text-right">
              <div className="truncate text-base font-bold">{board.userStart ? t("Sizning jamoa") : t("1-jamoa")}</div>
            </div>
            <div className="font-display text-6xl font-bold tabular-nums sm:text-7xl">
              <span>{scoreA ?? "–"}</span>
              <span className="mx-2 text-white/40">:</span>
              <span className="text-white/70">{scoreB ?? "–"}</span>
            </div>
            <div>
              <div className="truncate text-base font-bold">{board.userStart ? t("Raqiblar") : t("2-jamoa")}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2.5 text-sm text-white/75">
            <MapBadge map={m.map_name} className="size-7 rounded-lg text-[10px]" />
            <span>{mapMeta(m.map_name).name}</span>
            {m.duration_seconds != null && (
              <>
                <span className="text-white/30">·</span>
                <span>{formatDuration(m.duration_seconds, lang)}</span>
              </>
            )}
            {result && (
              <>
                <span className="text-white/30">·</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-bold uppercase tracking-wider">
                  {t(result === "win" ? "G'alaba" : result === "loss" ? "Mag'lubiyat" : "Durang")}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {m.user_in_demo === false && (
        <Notice tone="warn" title={t("Siz bu demoda topilmadingiz")}>
          {t("Demo tahlil qilindi, lekin unda sizning SteamID ({id}) uchramadi. Statistika hisoblanmadi; barcha killlar baribir ko'rsatiladi.", { id: user.steamId64 })}
        </Notice>
      )}

      <MatchView panels={panels} initial={kills.length ? "board" : "demo"} />
    </div>
  );
}
