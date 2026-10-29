import Image from "next/image";
import { ExternalLink, LogOut, MonitorSmartphone } from "lucide-react";
import { HistoryForm, PreferencesForm } from "@/components/settings-forms";
import { Button } from "@/components/ui/button";
import { Badge, Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { getSettings, getSteamAccount } from "@/lib/server/data";
import { env } from "@/lib/server/env";
import { pageUser } from "@/lib/server/session";
import { adminDb, userDb } from "@/lib/server/supabase";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Sozlamalar") };
}

export default async function SettingsPage() {
  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  const [steam, settings, sessions] = await Promise.all([
    getSteamAccount(db),
    getSettings(db),
    adminDb().from("sessions").select("id, created_at, last_seen_at, user_agent").eq("user_id", user.userId).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("last_seen_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <div className="label">{t("Hisob")}</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t("Sozlamalar")}</h1>
      </div>

      <section>
        <SectionTitle eyebrow="Steam" title={t("Steam profili")} />
        <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          {steam.avatar_url && <Image src={steam.avatar_url} alt="" width={64} height={64} className="rounded-2xl" unoptimized />}
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{steam.persona_name}</div>
            <div className="font-mono text-xs text-muted">SteamID64: {steam.steam_id64}</div>
            <div className="mt-1 text-xs text-subtle">
              {t("Ulangan")}: {formatDate(steam.created_at, true, lang)} · {t("Profil ma'lumotlari har kirishda Steam'dan yangilanadi")}
            </div>
          </div>
          {steam.profile_url && (
            <Button asChild variant="secondary" size="sm">
              <a href={steam.profile_url} target="_blank" rel="noopener noreferrer">
                {t("Steam profil")} <ExternalLink />
              </a>
            </Button>
          )}
        </Card>
      </section>

      <section id="history" className="scroll-mt-24">
        <SectionTitle
          eyebrow={t("Valve match tarixi API")}
          title={t("Match tarixi")}
          action={steam.history_enabled ? <Badge tone="neon">{t("Ulangan")}</Badge> : <Badge tone="warn">{t("Ulanmagan")}</Badge>}
        />
        <Card className="space-y-5 p-5">
          <Notice tone="neutral">
            {t("Matchmaking matchlaringiz shu yerdan avtomatik olinadi. FACEIT va boshqa platformalar matchlari uchun demo faylni o'zingiz yuklang.")}
          </Notice>
          {steam.history_last_error && <Notice tone="danger">{t(steam.history_last_error)}</Notice>}
          {env().STEAM_API_KEY ? (
            <HistoryForm enabled={steam.history_enabled} lastShareCode={steam.last_share_code} />
          ) : (
            <Notice tone="warn">
              {t("Serverda STEAM_API_KEY sozlanmagan, shuning uchun match tarixini ulab bo'lmaydi. Login va demo yuklash bunga bog'liq emas — demoni qo'lda yuklab, kill'larni ko'rishingiz mumkin.")}
            </Notice>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle eyebrow={t("Render va saqlash")} title={t("Video va saqlash")} />
        <Card className="p-5">
          <PreferencesForm initial={settings} />
        </Card>
      </section>

      <section>
        <SectionTitle eyebrow={t("Xavfsizlik")} title={t("Sessiyalar")} />
        <Card className="divide-y divide-line">
          {(sessions.data ?? []).map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <MonitorSmartphone className="size-4 text-subtle" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{s.user_agent ?? t("Noma'lum qurilma")}</div>
                <div className="text-xs text-subtle">
                  {t("Kirgan")}: {formatDate(s.created_at, true, lang)} · {t("Oxirgi faollik")}: {formatDate(s.last_seen_at, true, lang)}
                </div>
              </div>
              {s.id === user.sessionId && <Badge tone="neon">{t("shu qurilma")}</Badge>}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 p-4">
            <form action="/api/auth/logout" method="post">
              <Button variant="danger" type="submit">
                <LogOut /> {t("Akkauntdan chiqish")}
              </Button>
            </form>
            <form action="/api/auth/logout?all=1" method="post">
              <Button variant="ghost" type="submit">
                {t("Barcha qurilmalardan chiqish")}
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}
