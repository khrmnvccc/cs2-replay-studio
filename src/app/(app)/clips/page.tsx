import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { ClipGallery } from "@/components/clip-gallery";
import { ClipSort } from "@/components/clip-sort";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { listClips, onlineCapabilities } from "@/lib/server/data";
import { pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Kliplarim") };
}

export default async function ClipsPage({ searchParams }: PageProps<"/clips">) {
  const sp = await searchParams;
  const sort = sp.sort === "old" || sp.sort === "name" ? sp.sort : "new";
  const user = await pageUser();
  const { t } = await getT();
  const db = await userDb(user.userId);
  const [clips, online] = await Promise.all([listClips(db, sort), onlineCapabilities(db)]);
  const ready = clips.filter((c) => c.status === "ready").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mt-2 text-sm text-muted">
            {t("{n} ta clip · {r} tasi MP4 tayyor", { n: clips.length, r: ready })}
          </p>
        </div>
        <div data-tour="clips-sort" className="w-full sm:w-56">
          <ClipSort value={sort} />
        </div>
      </div>
      {clips.length ? (
        <ClipGallery clips={clips} online={online} renderOnline={Boolean(online.render)} />
      ) : (
        <EmptyState
          icon={<Clapperboard />}
          title={t("Hali clip yo'q")}
          action={
            <Button asChild variant="primary">
              <Link href="/matches">{t("Matchni tanlash")}</Link>
            </Button>
          }
        >
          {t("Match sahifasida kerakli killlarni tanlang, ular shu yerda klip bo'lib chiqadi.")}
        </EmptyState>
      )}
    </div>
  );
}
