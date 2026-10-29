"use client";
import { useState, type ReactNode } from "react";
import { ChevronRight, Clapperboard, Crosshair, Scissors, Tv } from "lucide-react";
import { useT } from "@/components/i18n";
import { cn } from "@/lib/utils";

export type MatchTab = "board" | "rounds" | "kills" | "replay" | "clutch" | "demo";

const TABS: { id: MatchTab; label: string; soon?: boolean }[] = [
  { id: "board", label: "Hisob jadvali" },
  { id: "rounds", label: "Raundlar" },
  { id: "kills", label: "O'ldirishlar" },
  { id: "replay", label: "Takror", soon: true },
  { id: "clutch", label: "Klatchlar", soon: true },
  { id: "demo", label: "Demo" },
];

function ActionCard({ icon, title, text, soon, onClick }: { icon: ReactNode; title: string; text: string; soon?: boolean; onClick?: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={soon ? undefined : onClick}
      aria-disabled={soon}
      className={cn("panel flex w-full items-center gap-4 p-4 text-left transition", soon ? "cursor-default" : "hover:-translate-y-0.5 active:scale-[0.99]")}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center [&_svg]:size-6", soon ? "text-subtle" : "text-neon")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{t(title)}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{t(text)}</span>
      </span>
      {soon ? (
        <span className="shrink-0 rounded-full bg-fg/[0.06] px-2.5 py-1 text-[11px] font-medium text-subtle">{t("Tez orada")}</span>
      ) : (
        <ChevronRight className="size-5 shrink-0 text-muted" />
      )}
    </button>
  );
}

/** Match sahifasining interaktiv qismi: harakat kartalari va tablar. Tab mazmuni serverda tayyorlanadi. */
export function MatchView({ panels, initial = "board" }: { panels: Record<MatchTab, ReactNode>; initial?: MatchTab }) {
  const t = useT();
  const [tab, setTab] = useState<MatchTab>(initial);
  const go = (id: MatchTab) => {
    setTab(id);
    document.getElementById("match-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="space-y-6">
      <div data-tour="match-actions" className="grid gap-3 lg:grid-cols-2">
        <ActionCard icon={<Clapperboard />} title="Kompilyatsiya" text="Barcha killlaringiz bitta videoda" soon />
        <ActionCard icon={<Tv />} title="To'liq o'yinni yozish" text="Barcha raundlar · Sizning POV · Bitta video" soon />
        <ActionCard icon={<Scissors />} title="Montaj yaratish" text="Montajga qo'shmoqchi bo'lgan o'ldirishlarni belgilang." onClick={() => go("kills")} />
        <ActionCard icon={<Crosshair />} title="Raundni yozish" text="Sizning POV: spawndan o'limgacha" soon />
      </div>

      <div id="match-tabs" data-tour="match-tabs" className="scroll-mt-20">
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4">
          {TABS.map(({ id, label, soon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "relative shrink-0 px-3 pb-2.5 pt-1 text-sm font-semibold transition",
                tab === id ? "text-fg after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-full after:bg-neon" : "text-muted hover:text-fg",
              )}
            >
              {t(label)}
              {soon && <span className="ml-1 align-super text-[9px] font-medium text-subtle">{t("tez orada")}</span>}
            </button>
          ))}
        </div>
        <div className="pt-5">{panels[tab]}</div>
      </div>
    </div>
  );
}
