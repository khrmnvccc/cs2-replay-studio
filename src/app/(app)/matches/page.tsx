import Link from "next/link";
import { ListVideo, Search, X } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { RefreshMatchesButton } from "@/components/refresh-matches";
import { Button } from "@/components/ui/button";
import { EmptyState, Input, Select } from "@/components/ui/primitives";
import { getSteamAccount, listActiveJobs, listMatches, onlineCapabilities, type MatchFilters } from "@/lib/server/data";
import { requireUser } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";
import { mapMeta } from "@shared/maps";

export const metadata = { title: "Matches" };

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
  const user = await requireUser();
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
          <div className="label">Match tarixi</div>
          <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none">Matches</h1>
          <p className="mt-2 text-sm text-muted">{all.length} ta match · Valve share code va siz yuklagan demolardan</p>
        </div>
        <RefreshMatchesButton enabled={steam.history_enabled} initialJobs={jobs} online={online} />
      </div>

      <form className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]" method="get">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input name="q" defaultValue={filters.q} placeholder="Qidiruv: xarita, share code, match ID" className="pl-9" />
        </div>
        <Select name="map" defaultValue={filters.map ?? ""} aria-label="Xarita">
          <option value="">Barcha xaritalar</option>
          {maps.map((m) => (
            <option key={m} value={m}>
              {mapMeta(m).name}
            </option>
          ))}
        </Select>
        <Select name="result" defaultValue={filters.result ?? ""} aria-label="Natija">
          <option value="">G&apos;alaba / mag&apos;lubiyat</option>
          <option value="win">G&apos;alaba</option>
          <option value="loss">Mag&apos;lubiyat</option>
          <option value="tie">Durang</option>
        </Select>
        <Input type="date" name="from" defaultValue={filters.from} aria-label="Sanadan" />
        <Input type="date" name="to" defaultValue={filters.to} aria-label="Sanagacha" />
        <div className="flex gap-2">
          <Button type="submit" variant="primary" className="flex-1">
            Filtrlash
          </Button>
          {filtered && (
            <Button asChild variant="ghost" size="icon" aria-label="Filtrlarni tozalash">
              <Link href="/matches">
                <X />
              </Link>
            </Button>
          )}
        </div>
      </form>
      {(filters.from || filters.to) && (
        <p className="-mt-5 text-xs text-subtle">Eslatma: yuklangan demo fayllarda match sanasi yozilmaydi, shuning uchun sana filtri faqat sanasi ma&apos;lum (Valve GC) matchlarga ishlaydi.</p>
      )}

      {matches.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      ) : filtered ? (
        <EmptyState icon={<Search />} title="Hech narsa topilmadi">
          Filtrlarni o&apos;zgartirib ko&apos;ring.
        </EmptyState>
      ) : (
        <EmptyState
          icon={<ListVideo />}
          title="Matchlar hali yo'q"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="primary">
                <Link href="/dashboard#upload">Demo yuklash</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/settings#history">Match tarixini ulash</Link>
              </Button>
            </div>
          }
        >
          Steam Web API matchlarni faqat siz bergan <b className="text-fg">Game Authentication Code</b> va <b className="text-fg">share code</b> orqali ko&apos;rsatadi. Yoki demo fayl yuklang — match avtomatik yaratiladi.
        </EmptyState>
      )}
    </div>
  );
}
