import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { ClipGallery } from "@/components/clip-gallery";
import { Button } from "@/components/ui/button";
import { EmptyState, Select } from "@/components/ui/primitives";
import { listClips, onlineCapabilities } from "@/lib/server/data";
import { requireUser } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";

export const metadata = { title: "My Clips" };

export default async function ClipsPage({ searchParams }: PageProps<"/clips">) {
  const sp = await searchParams;
  const sort = sp.sort === "old" || sp.sort === "name" ? sp.sort : "new";
  const user = await requireUser();
  const db = await userDb(user.userId);
  const [clips, online] = await Promise.all([listClips(db, sort), onlineCapabilities(db)]);
  const ready = clips.filter((c) => c.status === "ready").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="label">Kill kliplar</div>
          <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none">My Clips</h1>
          <p className="mt-2 text-sm text-muted">
            {clips.length} ta clip · {ready} tasi MP4 tayyor
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <Select name="sort" defaultValue={sort} aria-label="Saralash" className="w-52">
            <option value="new">Avval yangilari</option>
            <option value="old">Avval eskilari</option>
            <option value="name">Nomi bo&apos;yicha</option>
          </Select>
          <Button type="submit" variant="secondary">
            Saralash
          </Button>
        </form>
      </div>
      {clips.length ? (
        <ClipGallery clips={clips} online={online} renderOnline={Boolean(online.render)} />
      ) : (
        <EmptyState
          icon={<Clapperboard />}
          title="Hali clip yo'q"
          action={
            <Button asChild variant="primary">
              <Link href="/matches">Matchni tanlash</Link>
            </Button>
          }
        >
          Tahlil qilingan match sahifasida kill timeline&apos;dan killlarni tanlang — har biri uchun MP4 clip render navbatiga qo&apos;yiladi.
        </EmptyState>
      )}
    </div>
  );
}
