import Image from "next/image";
import { ExternalLink, LogOut, MonitorSmartphone } from "lucide-react";
import { HistoryForm, PreferencesForm } from "@/components/settings-forms";
import { Button } from "@/components/ui/button";
import { Badge, Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { getSettings, getSteamAccount } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { requireUser } from "@/lib/server/http";
import { adminDb, userDb } from "@/lib/server/supabase";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const user = await requireUser();
  const db = await userDb(user.userId);
  const [steam, settings, sessions] = await Promise.all([
    getSteamAccount(db),
    getSettings(db),
    adminDb().from("sessions").select("id, created_at, last_seen_at, user_agent").eq("user_id", user.userId).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("last_seen_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <div className="label">Hisob</div>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none">Sozlamalar</h1>
      </div>

      <section>
        <SectionTitle eyebrow="Steam" title="Steam profili" />
        <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          {steam.avatar_url && <Image src={steam.avatar_url} alt="" width={64} height={64} className="rounded-xl" unoptimized />}
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{steam.persona_name}</div>
            <div className="font-mono text-xs text-muted">SteamID64: {steam.steam_id64}</div>
            <div className="mt-1 text-xs text-subtle">Ulangan: {formatDate(steam.created_at)} · Profil ma&apos;lumotlari har kirishda Steam&apos;dan yangilanadi</div>
          </div>
          {steam.profile_url && (
            <Button asChild variant="secondary" size="sm">
              <a href={steam.profile_url} target="_blank" rel="noopener noreferrer">
                Steam profil <ExternalLink />
              </a>
            </Button>
          )}
        </Card>
      </section>

      <section id="history" className="scroll-mt-24">
        <SectionTitle
          eyebrow="Valve match tarixi API"
          title="Match tarixi"
          action={steam.history_enabled ? <Badge tone="neon">Ulangan</Badge> : <Badge tone="warn">Ulanmagan</Badge>}
        />
        <Card className="space-y-5 p-5">
          <Notice tone="neutral">
            Valve matchmaking tarixini faqat <b className="text-fg">ICSGOPlayers_730/GetNextMatchSharingCode</b> orqali beradi: u yangi matchlarning share code&apos;larini qaytaradi. Sana, hisob va K/D uchun Valve Game Coordinator (GC bot worker) yoki demo tahlili kerak. FACEIT va boshqa platformalar matchlari bu API&apos;da yo&apos;q — ularning demosini yuklang.
          </Notice>
          {steam.history_last_error && <Notice tone="danger">{steam.history_last_error}</Notice>}
          {env().STEAM_API_KEY ? (
            <HistoryForm enabled={steam.history_enabled} lastShareCode={steam.last_share_code} />
          ) : (
            <Notice tone="warn">
              Serverda <b className="text-fg">STEAM_API_KEY</b> sozlanmagan, shuning uchun match tarixini ulab bo&apos;lmaydi. Login va demo yuklash bunga bog&apos;liq emas — demoni qo&apos;lda yuklab, kill&apos;larni ko&apos;rishingiz mumkin.
            </Notice>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle eyebrow="Render va saqlash" title="Video va saqlash" />
        <Card className="p-5">
          <PreferencesForm initial={settings} />
        </Card>
      </section>

      <section>
        <SectionTitle eyebrow="Xavfsizlik" title="Sessiyalar" />
        <Card className="divide-y divide-line">
          {(sessions.data ?? []).map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <MonitorSmartphone className="size-4 text-subtle" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{s.user_agent ?? "Noma'lum qurilma"}</div>
                <div className="text-xs text-subtle">
                  Kirgan: {formatDate(s.created_at)} · Oxirgi faollik: {formatDate(s.last_seen_at)}
                </div>
              </div>
              {s.id === user.sessionId && <Badge tone="neon">shu qurilma</Badge>}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 p-4">
            <form action="/api/auth/logout" method="post">
              <Button variant="danger" type="submit">
                <LogOut /> Akkauntdan chiqish
              </Button>
            </form>
            <form action="/api/auth/logout?all=1" method="post">
              <Button variant="ghost" type="submit">
                Barcha qurilmalardan chiqish
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}
