import Link from "next/link";
import { ListVideo, Search, X } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { RefreshMatchesButton } from "@/components/refresh-matches";
import { Button } from "@/components/ui/button";
import { EmptyState, Input, Select } from "@/components/ui/primitives";
import { AddShareCodes } from "@/components/add-share-codes";
import { getSteamAccount, listActiveJobs, listMatches, onlineCapabilities, type MatchFilters } from "@/lib/server/data";
import { pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import { mapMeta } from "@shared/maps";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Matchlar") };
}

const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function MatchesPage({ searchParams }: PageProps<"/matches">) {
  const sp = await searchParams;
  const result = one(sp.result);
  const filters: MatchFilters = {
    map: one(sp.map),
    result: result === "win" || result === "loss" || result === "tie" ? result : undefined,
    from: one(sp.from)?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0],
    to: one(sp.to)?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0],
    q: one(sp.q),
  };
  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  const [matches, all, steam, jobs, online] = await Promise.all([
    listMatches(db, filters),
    listMatches(db, {}, 1000),
    getSteamAccount(db),
    listActiveJobs(db),
    onlineCapabilities(db),
  ]);
  const maps = [...new Set(all.map((m) => m.map_name).filter(Boolean))] as string[];
  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label">{t("Match tarixi")}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t("Matchlar")}</h1>
          <p className="mt-2 text-sm text-muted">{t("{n} ta match · Valve share code va siz yuklagan demolardan", { n: all.length })}</p>
        </div>
        <RefreshMatchesButton enabled={steam.history_enabled} initialJobs={jobs} online={online} />
      </div>

      <AddShareCodes gcOnline={Boolean(online.gc)} />

      <form className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]" method="get">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input name="q" defaultValue={filters.q} placeholder={t("Qidiruv: xarita, share code, match ID")} className="pl-9" />
        </div>
        <Select name="map" defaultValue={filters.map ?? ""} aria-label={t("Xarita")}>
          <option value="">{t("Barcha xaritalar")}</option>
          {maps.map((m) => (
            <option key={m} value={m}>
              {mapMeta(m).name}
            </option>
          ))}
        </Select>
        <Select name="result" defaultValue={filters.result ?? ""} aria-label={t("Natija")}>
          <option value="">{t("G'alaba / mag'lubiyat")}</option>
          <option value="win">{t("G'alaba")}</option>
          <option value="loss">{t("Mag'lubiyat")}</option>
          <option value="tie">{t("Durang")}</option>
        </Select>
        <Input type="date" name="from" defaultValue={filters.from} aria-label={t("Sanadan")} />
        <Input type="date" name="to" defaultValue={filters.to} aria-label={t("Sanagacha")} />
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1">
            {t("Filtrlash")}
          </Button>
          {filtered && (
            <Button asChild variant="ghost" size="icon" aria-label={t("Filtrlarni tozalash")}>
              <Link href="/matches">
                <X />
              </Link>
            </Button>
          )}
        </div>
      </form>
      {(filters.from || filters.to) && (
        <p className="-mt-5 text-xs text-subtle">{t("Eslatma: yuklangan demo fayllarda match sanasi yozilmaydi, shuning uchun sana filtri faqat sanasi ma'lum matchlarga ishlaydi.")}</p>
      )}

      {matches.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} m={m} lang={lang} />
          ))}
        </div>
      ) : filtered ? (
        <EmptyState icon={<Search />} title={t("Hech narsa topilmadi")}>
          {t("Filtrlarni o'zgartirib ko'ring.")}
        </EmptyState>
      ) : (
        <EmptyState
          icon={<ListVideo />}
          title={t("Matchlar hali yo'q")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="primary">
                <Link href="/dashboard#upload">{t("Demo yuklash")}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/settings#history">{t("Match tarixini ulash")}</Link>
              </Button>
            </div>
          }
        >
          {t("Yuqoridagi maydonga CS2'dan share code joylang yoki demo fayl yuklang — match avtomatik yaratiladi.")}
        </EmptyState>
      )}
    </div>
  );
}
