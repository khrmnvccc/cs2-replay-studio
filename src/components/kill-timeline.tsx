"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, EyeOff, Film, Layers, Skull, Wind, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatTickTime } from "@shared/clip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { api, toastError } from "@/lib/client/api";
import type { KillEventRow, RoundRow } from "@/lib/types";
import { cn, weaponName } from "@/lib/utils";
import { useI18n } from "@/components/i18n";

export function KillTimeline({ kills, rounds, tickrate, existingClipKillIds, pre, post }: { kills: KillEventRow[]; rounds: RoundRow[]; tickrate: number; existingClipKillIds: string[]; pre: number; post: number }) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [onlyMine, setOnlyMine] = useState(kills.some((k) => k.is_user_kill));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [preS, setPre] = useState(pre);
  const [postS, setPost] = useState(post);
  const hasClip = new Set(existingClipKillIds);

  const visible = useMemo(() => kills.filter((k) => !onlyMine || k.is_user_kill || k.is_user_death), [kills, onlyMine]);
  const byRound = useMemo(() => {
    const m = new Map<number, KillEventRow[]>();
    for (const k of visible) m.set(k.round_number, [...(m.get(k.round_number) ?? []), k]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [visible]);
  const myKills = kills.filter((k) => k.is_user_kill);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const create = async (ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      const r = await api<{ created: unknown[] }>("/api/clips", { method: "POST", json: { killEventIds: ids.slice(0, 50), preSeconds: preS, postSeconds: postS } });
      toast.success(t("{n} ta clip render navbatiga qo'yildi", { n: r.created.length }));
      if (ids.length > 50) toast.info(t("Bir martada 50 ta — qolganlarini yana tanlang"));
      setSelected(new Set());
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  if (!kills.length) return null;
  return (
    <div className="space-y-4">
      <div className="panel z-20 flex flex-wrap items-center gap-3 p-3 sm:sticky sm:top-16 lg:top-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          {t("Faqat mening killlarim / o'limlarim")}
        </label>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t("Oldin")}</span>
          <input type="number" min={0} max={30} value={preS} onChange={(e) => setPre(Number(e.target.value))} className="h-8 w-14 rounded-lg border border-line-strong bg-surface-2 px-2 font-mono text-base text-fg sm:text-xs" aria-label={t("Kill'dan oldin (soniya)")} />
          <span>s · {t("Keyin")}</span>
          <input type="number" min={0} max={30} value={postS} onChange={(e) => setPost(Number(e.target.value))} className="h-8 w-14 rounded-lg border border-line-strong bg-surface-2 px-2 font-mono text-base text-fg sm:text-xs" aria-label={t("Kill'dan keyin (soniya)")} />
          <span>s</span>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
          <Button size="sm" variant="secondary" disabled={!myKills.length || busy} onClick={() => create(myKills.map((k) => k.id))}>
            <Layers /> {t("Barcha killlarim")} ({myKills.length})
          </Button>
          <Button size="sm" variant="primary" disabled={!selected.size} loading={busy} onClick={() => create([...selected])}>
            <Film /> {t("Clip yaratish")} ({selected.size})
          </Button>
        </div>
      </div>

      <ol className="relative space-y-6 border-l border-line pl-5 sm:pl-7">
        {byRound.map(([round, ks]) => {
          const r = rounds.find((x) => x.round_number === round);
          return (
            <li key={round} className="relative">
              <span className={cn("absolute -left-[27px] top-1 size-3 rounded-full border-2 border-bg sm:-left-[35px]", r?.winner === "CT" ? "bg-ct" : r?.winner === "T" ? "bg-tside" : "bg-subtle")} />
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base font-semibold">{t("Raund {n}", { n: round })}</span>
                {r?.winner && <Badge tone={r.winner === "CT" ? "ct" : "t"}>{t("{side} yutdi", { side: r.winner })}</Badge>}
                {r?.reason && <span className="font-mono text-[10.5px] text-subtle">{r.reason}</span>}
              </div>
              <div className="space-y-1.5">
                {ks.map((k) => {
                  const mine = k.is_user_kill;
                  const death = k.is_user_death;
                  return (
                    <label
                      key={k.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                        selected.has(k.id) ? "border-neon/50 bg-neon/[0.06]" : mine ? "border-neon/15 bg-surface hover:border-neon/35" : death ? "border-danger/15 bg-surface hover:border-danger/30" : "border-line bg-surface/60 hover:border-line-strong",
                      )}
                    >
                      <input type="checkbox" checked={selected.has(k.id)} onChange={() => toggle(k.id)} aria-label={t("Killni tanlash")} />
                      <span className="w-12 shrink-0 font-mono text-xs text-subtle" title={`tick ${k.tick}`}>
                        {k.seconds_into_round != null ? formatTickTime(k.seconds_into_round * tickrate, tickrate) : formatTickTime(k.tick, tickrate)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className={cn("truncate font-medium", k.killer_side === "CT" ? "text-ct" : k.killer_side === "T" ? "text-tside" : "", mine && "underline decoration-neon/60 underline-offset-4")}>{k.killer_name ?? t("Dunyo")}</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-fg/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-fg/80">
                          {weaponName(k.weapon, lang)}
                          {k.headshot && <Crosshair className="size-3 text-neon" aria-label="Headshot" />}
                          {k.wallbang && <Zap className="size-3 text-warn" aria-label="Wallbang" />}
                          {k.through_smoke && <Wind className="size-3 text-muted" aria-label={t("Tutun orqali")} />}
                          {k.noscope && <span className="text-[9px] text-violet">NS</span>}
                          {k.attacker_blind && <EyeOff className="size-3 text-muted" aria-label={t("Ko'r holda")} />}
                        </span>
                        <span className={cn("truncate", k.victim_side === "CT" ? "text-ct" : k.victim_side === "T" ? "text-tside" : "", death && "line-through decoration-danger/70")}>{k.victim_name ?? "?"}</span>
                        {k.assister_name && <span className="truncate text-xs text-subtle">+ {k.assister_name}</span>}
                      </div>
                      {mine && <Badge tone="neon">{t("Siz")}</Badge>}
                      {death && <Skull className="size-4 text-danger/80" aria-label={t("Siz o'ldirildingiz")} />}
                      {hasClip.has(k.id) && <Badge tone="violet">clip</Badge>}
                      <button
                        type="button"
                        className="hidden rounded-lg px-2 py-1 text-xs text-muted hover:bg-fg/5 hover:text-neon sm:block"
                        onClick={(e) => {
                          e.preventDefault();
                          void create([k.id]);
                        }}
                      >
                        Clip
                      </button>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
