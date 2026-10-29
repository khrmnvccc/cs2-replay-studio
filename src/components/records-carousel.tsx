"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useI18n } from "@/components/i18n";
import type { RecordSlide } from "@/app/api/records/route";
import { api } from "@/lib/client/api";
import { mapMeta } from "@shared/maps";
import { cn, formatDayMonth } from "@/lib/utils";

// Laylak "reys" kartalari ranglari: navbatma-navbat
const PALETTES = [
  ["#f08a3c", "#c9561b", "rgb(232 121 43 / 0.75)"],
  ["#2a8a62", "#165c40", "rgb(31 122 85 / 0.75)"],
  ["#2f73ad", "#163f66", "rgb(29 92 141 / 0.75)"],
] as const;

/** Menyuning tepasida: rekordlar bittadan almashib, yonib turadigan kartalar to'plami. */
export function RecordsCarousel({ active, onNavigate }: { active: boolean; onNavigate?: () => void }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<RecordSlide[] | null>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!active || items) return;
    let alive = true;
    api<{ records: RecordSlide[] }>("/api/records")
      .then((r) => alive && setItems(r.records))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [active, items]);

  useEffect(() => {
    if (!active || !items || items.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % items.length), 3200);
    return () => clearInterval(id);
  }, [active, items]);

  if (items == null) return <div className="mb-4 h-[9.5rem] animate-pulse rounded-[1.5rem] bg-fg/[0.06]" />;

  if (!items.length)
    return (
      <Link href="/records" onClick={onNavigate} className="mb-4 block overflow-hidden rounded-[1.5rem] p-4 text-white" style={{ background: `linear-gradient(135deg, ${PALETTES[2][0]}, ${PALETTES[2][1]})` }}>
        <div className="text-[15px] font-extrabold">{t("Rekordlar")}</div>
        <div className="mt-1 text-xs text-white/80">{t("Demo tahlil qilingach, eng yaxshi natijalaringiz shu yerda aylanib turadi.")}</div>
      </Link>
    );

  const r = items[i % items.length];
  const [from, to, glow] = PALETTES[i % PALETTES.length];
  const behind = [PALETTES[(i + 1) % PALETTES.length], PALETTES[(i + 2) % PALETTES.length]];
  const date = formatDayMonth(r.at, lang);

  return (
    <div className="mb-4">
      <div className="relative pb-4">
        {/* Orqadagi kartalar — to'plam ko'rinishi */}
        <div className="absolute inset-x-6 bottom-0 h-10 rounded-b-[1.5rem]" style={{ background: behind[1][1] }} />
        <div className="absolute inset-x-3 bottom-2 h-10 rounded-b-[1.5rem]" style={{ background: behind[0][1] }} />

        <Link
          key={r.id + i}
          href={`/matches/${r.matchId}`}
          onClick={onNavigate}
          className="relative block animate-[slide-in_.45s_cubic-bezier(.2,.8,.2,1),glow_2.4s_ease-in-out_infinite] overflow-hidden rounded-[1.5rem] p-4 text-white"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, ["--glow" as string]: glow }}
        >
          <Trophy className="pointer-events-none absolute -bottom-4 -right-3 size-28 rotate-[-12deg] text-white/[0.13]" strokeWidth={1.5} />
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-[shine_3.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[15px] font-extrabold">{t(r.label)}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">{t("Shaxsiy rekord")}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{mapMeta(r.map).name}</div>
              <div className="text-xs font-semibold text-white/90">{date}</div>
            </div>
          </div>
          <div className="relative mt-2 flex items-end justify-between">
            <span className="font-display text-[34px] font-extrabold leading-none tabular-nums">{r.value}</span>
            {r.score && <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">{r.score}</span>}
          </div>
        </Link>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {items.map((x, k) => (
          <button key={x.id} onClick={() => setI(k)} aria-label={t(x.label)} className={cn("h-1.5 rounded-full transition-all", k === i % items.length ? "w-5 bg-accent" : "w-1.5 bg-fg/20")} />
        ))}
      </div>
    </div>
  );
}
