import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clapperboard, ExternalLink, FileSearch, ListVideo } from "lucide-react";
import { DemoUpload } from "@/components/demo-upload";
import { JobItem } from "@/components/job-list";
import { MatchCard } from "@/components/match-card";
import { RefreshMatchesButton } from "@/components/refresh-matches";
import { ClipThumb } from "@/components/clip-thumb";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Notice, SectionTitle, Stat } from "@/components/ui/primitives";
import { getT } from "@/lib/i18n/server";
import { dashboardStats, getSteamAccount, listActiveJobs, listClips, listMatches, onlineCapabilities } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { isOwner, pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import { formatDate } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Bosh sahifa") };
}

export default async function Dashboard() {
  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  const [steam, stats, matches, clips, jobs, online] = await Promise.all([
    getSteamAccount(db),
    dashboardStats(db),
    listMatches(db, {}, 6),
    listClips(db),
    listActiveJobs(db),
    onlineCapabilities(db),
  ]);
  const workerOnline = Boolean(online.parse);
  const owner = isOwner(user);

  return (
    <div className="space-y-10">
      {/* Profil */}
      <section className="panel relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-neon/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 size-72 rounded-full bg-ct/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {steam.avatar_url ? (
            <Image src={steam.avatar_url} alt="Steam avatar" width={84} height={84} className="rounded-3xl ring-4 ring-surface" unoptimized />
          ) : (
            <div className="size-[84px] rounded-3xl bg-surface-3" />
          )}
          <div className="min-w-0 flex-1">
            <div className="label">{t("Steam profil")}</div>
            <h1 className="mt-1 truncate text-3xl font-bold tracking-tight sm:text-4xl">{steam.persona_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="font-mono">{steam.steam_id64}</span>
              {steam.profile_url && (
                <a href={steam.profile_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fg/80 hover:text-neon">
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
          <div className="flex flex-col gap-2 sm:items-end [&>*]:w-full sm:[&>*]:w-auto">
            <RefreshMatchesButton enabled={steam.history_enabled} initialJobs={jobs} online={online} />
            <Button asChild variant="primary">
              <a href="#upload">
                <FileSearch /> {t("Demoni tahlil qilish")}
              </a>
            </Button>
          </div>
        </div>
        {steam.history_last_error && (
          <Notice tone="danger" className="relative mt-5" title={t("Match tarixini yangilab bo'lmadi")}>
            {t(steam.history_last_error)}.{" "}
            <Link className="underline" href="/settings#history">
              {t("Sozlamalar")}
            </Link>{" "}
            {t("bo'limida qayta ulang.")}
          </Notice>
        )}
      </section>

      {owner && !workerOnline && (
        <Notice tone="warn" title={t("Fon xizmati (worker) onlayn emas")}>
          {t("Demo tahlili va ZIP yaratish worker'da bajariladi. Ishlar navbatda turadi va worker ishga tushishi bilan bajariladi.")}{" "}
          <Link href="/system" className="underline">
            {t("Tizim holati")}
          </Link>
        </Notice>
      )}

      {/* Statistika */}
      <section>
        <SectionTitle eyebrow={t("Statistika")} title={t("Sizning ko'rsatkichlaringiz")} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      {/* Demo yuklash */}
      <section id="upload" className="scroll-mt-24">
        <SectionTitle eyebrow={t("Demo tahlili")} title={t("Demo yuklash")} />
        <DemoUpload maxMb={env().DEMO_MAX_MB} online={online} />
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          {t("Demo'ni qayerdan olish: CS2 → Watch → Your Matches → yuklab olish tugmasi. Fayl shu papkada paydo bo'ladi:")}{" "}
          <span className="font-mono">Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\replays</span>. {t("FACEIT/turnir demolari ham qo'llab-quvvatlanadi.")}
        </p>
      </section>

      {jobs.length > 0 && (
        <section>
          <SectionTitle eyebrow={t("Jarayonlar")} title={t("Faol ishlar")} />
          <div className="grid gap-2 md:grid-cols-2">
            {jobs.slice(0, 6).map((j) => (
              <JobItem key={j.id} job={j} online={online} />
            ))}
          </div>
        </section>
      )}

      {/* Oxirgi matchlar */}
      <section>
        <SectionTitle
          eyebrow={t("Oxirgi matchlar")}
          title={t("Matchlar")}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/matches">
                {t("Barchasi")} <ArrowRight />
              </Link>
            </Button>
          }
        />
        {matches.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} m={m} lang={lang} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<ListVideo />} title={t("Hali match yo'q")}>
            {t("Matchlar ikki yo'l bilan paydo bo'ladi:")}{" "}
            <Link className="text-fg underline" href="/settings#history">
              {t("match tarixini ulang")}
            </Link>{" "}
            {t("(Valve share code) yoki yuqorida demo fayl yuklang.")}
          </EmptyState>
        )}
      </section>

      {/* Oxirgi kliplar */}
      <section>
        <SectionTitle
          eyebrow={t("Oxirgi kill kliplar")}
          title={t("Kliplar")}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/clips">
                {t("Barchasi")} <ArrowRight />
              </Link>
            </Button>
          }
        />
        {clips.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {clips.slice(0, 4).map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <ClipThumb clip={c} lang={lang} />
                <div className="p-3">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{formatDate(c.created_at, true, lang)}</div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Clapperboard />} title={t("Clip yo'q")}>
            {t("Match sahifasida kill xronologiyasidan bitta yoki bir nechta killni tanlab clip yarating.")}
          </EmptyState>
        )}
      </section>
    </div>
  );
}
