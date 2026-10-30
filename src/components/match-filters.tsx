"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Map as MapIcon, Upload } from "lucide-react";
import { AddShareCodes } from "@/components/add-share-codes";
import { DemoUpload } from "@/components/demo-upload";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Picker } from "@/components/ui/picker";
import { MapBadge } from "@/components/match-card";

/** Xarita tanlash: URL'dagi ?map= ni almashtiradi (boshqa filtrlar saqlanadi). */
export function MapSelect({ maps }: { maps: { id: string; name: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useT();
  const change = (v: string) => {
    const q = new URLSearchParams(sp.toString());
    if (v) q.set("map", v);
    else q.delete("map");
    router.push(`/matches${q.size ? `?${q}` : ""}`, { scroll: false });
  };
  return (
    <Picker
      value={sp.get("map") ?? ""}
      onChange={change}
      title={t("Xarita")}
      icon={<MapIcon />}
      center
      options={[
        { value: "", label: t("Barcha xaritalar"), icon: <span className="grid size-8 place-items-center rounded-lg bg-fg/[0.06] text-muted"><MapIcon className="size-4" /></span> },
        ...maps.map((m) => ({ value: m.id, label: m.name, icon: <MapBadge map={m.id} className="size-8 rounded-lg text-[10px]" /> })),
      ]}
    />
  );
}

export function UploadButton({ maxMb, className }: { maxMb: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <Button variant="primary" size="lg" className={className} onClick={() => setOpen(true)}>
        <Upload /> {t("Demo yuklash")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title={t("Demo yuklash")} closeLabel={t("Yopish")} className="max-w-xl">
        <div className="space-y-4">
          <DemoUpload maxMb={maxMb} />
          <p className="text-xs leading-relaxed text-subtle">
            {t("Demo'ni qayerdan olish: CS2 → Watch → Your Matches → yuklab olish tugmasi. Fayl shu papkada paydo bo'ladi:")}{" "}
            <span className="break-all font-mono">Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\replays</span>
          </p>
          <AddShareCodes gcOnline />
        </div>
      </Dialog>
    </>
  );
}
