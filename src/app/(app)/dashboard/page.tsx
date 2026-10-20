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
import { dashboardStats, getSteamAccount, listActiveJobs, listClips, listMatches, onlineCapabilities } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { requireUser } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser();
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

  return (
    <div className="space-y-10">
      {/* Profile */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-[radial-gradient(70%_140%_at_100%_0%,rgba(143,107,255,0.14),transparent_60%),radial-gradient(50%_120%_at_0%_100%,rgba(180,255,46,0.07),transparent_60%),#0d0f12] p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {steam.avatar_url ? (
            <Image src={steam.avatar_url} alt="Steam avatar" width={88} height={88} className="rounded-2xl ring-1 ring-white/10" unoptimized />
          ) : (
            <div className="size-[88px] rounded-2xl bg-surface-3" />
          )}
          <div className="min-w-0 flex-1">
            <div className="label">Steam profil</div>
            <h1 className="mt-1 truncate font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{steam.persona_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="font-mono">{steam.steam_id64}</span>
              {steam.profile_url && (
                <a href={steam.profile_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fg/80 hover:text-neon">
                  Steam profil <ExternalLink className="size-3" />
                </a>
              )}
              {steam.history_enabled ? (
                <Badge tone="neon">Match tarixi ulangan</Badge>
              ) : (
                <Badge tone="warn">Match tarixi ulanmagan</Badge>
              )}
              {steam.history_last_synced_at && <span>Oxirgi yangilanish: {formatDate(steam.history_last_synced_at)}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <RefreshMatchesButton enabled={steam.history_enabled} initialJobs={jobs} online={online} />
            <Button asChild variant="primary">
              <a href="#upload">
                <FileSearch /> Analyze demo
              </a>
            </Button>
          </div>
        </div>
        {steam.history_last_error && (
          <Notice tone="danger" className="mt-5" title="Match tarixini yangilab bo'lmadi">
            {steam.history_last_error}. <Link className="underline" href="/settings#history">Settings</Link> bo&apos;limida qayta ulang.
          </Notice>
        )}
      </section>

      {!workerOnline && (
        <Notice tone="warn" title="Background worker onlayn emas">
          Demo tahlili, match tarixini yangilash va ZIP yaratish worker&apos;da bajariladi. Ishlar navbatda turadi va worker ishga tushishi bilan bajariladi.{" "}
          <Link href="/system" className="underline">Tizim holati</Link>
        </Notice>
      )}

      {/* Stats */}
      <section>
        <SectionTitle eyebrow="Statistika" title="Sizning ko'rsatkichlaringiz" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Matchlar" value={stats.matches} sub={stats.matches ? `${stats.matchesWithStats} tasida to'liq statistika` : "Hali match yo'q"} />
          <Stat label="G'alaba" value={stats.decided ? `${Math.round((stats.wins / stats.decided) * 100)}%` : "—"} sub={stats.decided ? `${stats.wins} / ${stats.decided} match` : "Natijali match yo'q"} accent />
          <Stat label="K/D" value={stats.kd != null ? stats.kd.toFixed(2) : "—"} sub={stats.kills ? `${stats.kills} kill · ${stats.deaths} death · ${stats.assists} assist` : "Statistika demo/GC dan olinadi"} />
          <Stat label="Headshot" value={stats.hsPercent != null ? `${stats.hsPercent.toFixed(0)}%` : "—"} sub={stats.headshots ? `${stats.headshots} ta headshot` : "—"} />
        </div>
      </section>

      {/* Upload */}
      <section id="upload" className="scroll-mt-24">
        <SectionTitle eyebrow="Demo tahlili" title="Demo yuklash" />
        <DemoUpload maxMb={env().DEMO_MAX_MB} online={online} />
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Demo&apos;ni qayerdan olish: CS2 → Watch → Your Matches → yuklab olish tugmasi. Fayl{" "}
          <span className="font-mono">Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\replays</span> papkasida paydo bo&apos;ladi. FACEIT/turnir demolari ham qo&apos;llab-quvvatlanadi.
        </p>
      </section>

      {jobs.length > 0 && (
        <section>
          <SectionTitle eyebrow="Jarayonlar" title="Faol ishlar" />
          <div className="grid gap-2 md:grid-cols-2">
            {jobs.slice(0, 6).map((j) => (
              <JobItem key={j.id} job={j} online={online} />
            ))}
          </div>
        </section>
      )}

      {/* Recent matches */}
      <section>
        <SectionTitle
          eyebrow="Oxirgi matchlar"
          title="Matchlar"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/matches">
                Barchasi <ArrowRight />
              </Link>
            </Button>
          }
        />
        {matches.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<ListVideo />} title="Hali match yo'q">
            Matchlar ikki yo&apos;l bilan paydo bo&apos;ladi: <Link className="text-fg underline" href="/settings#history">match tarixini ulang</Link> (Valve share code) yoki yuqorida demo fayl yuklang.
          </EmptyState>
        )}
      </section>

      {/* Recent clips */}
      <section>
        <SectionTitle
          eyebrow="Oxirgi kill kliplar"
          title="Clips"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/clips">
                Barchasi <ArrowRight />
              </Link>
            </Button>
          }
        />
        {clips.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {clips.slice(0, 4).map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <ClipThumb clip={c} />
                <div className="p-3">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{formatDate(c.created_at)}</div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Clapperboard />} title="Clip yo'q">
            Match sahifasida kill timeline&apos;dan bitta yoki bir nechta killni tanlab clip yarating.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
