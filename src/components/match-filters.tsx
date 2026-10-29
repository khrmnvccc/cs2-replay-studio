"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Map as MapIcon, Upload } from "lucide-react";
import { AddShareCodes } from "@/components/add-share-codes";
import { DemoUpload } from "@/components/demo-upload";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

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
    <label className="relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 text-[15px] font-semibold">
      <MapIcon className="size-5 text-muted" />
      <span>{maps.find((m) => m.id === sp.get("map"))?.name ?? t("Barcha xaritalar")}</span>
      <svg viewBox="0 0 10 6" className="size-2.5 text-muted" fill="currentColor" aria-hidden>
        <path d="M0 0h10L5 6z" />
      </svg>
      <select className="absolute inset-0 cursor-pointer opacity-0" value={sp.get("map") ?? ""} onChange={(e) => change(e.target.value)} aria-label={t("Xarita")}>
        <option value="">{t("Barcha xaritalar")}</option>
        {maps.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
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
