"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layers, Search, Tags, X } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { MapBadge } from "@/components/match-card";
import {
  CALLOUT_MAPS,
  GROUP_ORDER,
  GROUPS,
  RADAR_SIZE,
  calloutName,
  zoneColor,
  type CalloutGroup,
  type CalloutLevel,
  type CalloutMap,
  type CalloutMapData,
} from "@/lib/callouts";
import { cn } from "@/lib/utils";
import { mapMeta } from "@shared/maps";

/** Ko'pburchak yuzasi (shoelace) — qaysi yozuv muhimroq ekanini aniqlash uchun. */
function polyArea(pts: string) {
  const xy = pts.split(" ").map((q) => q.split(",").map(Number));
  let a = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

type Zone = { id: string; g: CalloutGroup; p: string[]; l: [number, number]; name: string; alt: string; color: string };

export function CalloutsView({ initialMap }: { initialMap: CalloutMap }) {
  const { lang, t } = useI18n();
  const ru = lang === "ru";
  const [map, setMap] = useState<CalloutMap>(initialMap);
  const [level, setLevel] = useState<CalloutLevel>("upper");
  const [data, setData] = useState<{ map: CalloutMap; d: CalloutMapData } | null>(null);
  const [failed, setFailed] = useState<CalloutMap | null>(null);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<CalloutGroup | "all">("all");
  const [sel, setSel] = useState<string | null>(null);
  const [labels, setLabels] = useState(true);
  const radar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let off = false;
    fetch(`/callouts/${map}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: CalloutMapData) => !off && setData({ map, d }))
      .catch(() => !off && setFailed(map));
    return () => {
      off = true;
    };
  }, [map]);

  const pick = (m: CalloutMap) => {
    if (m === map) return;
    setMap(m);
    setLevel("upper");
    setSel(null);
    setQ("");
    setGroup("all");
    try {
      history.replaceState(null, "", `/callouts?map=${m}`);
    } catch {}
  };

  const loaded = data?.map === map ? data.d : null;
  const hasLower = Boolean(loaded?.lower?.length);

  // Nomlar bir xil tartibda: guruh (A, B, Mid, T, CT), keyin alifbo bo'yicha. Rang shu tartibdan.
  const zones: Zone[] = useMemo(() => {
    const raw = loaded?.[level] ?? [];
    const named = raw.map((z) => {
      const [en, rus] = calloutName(map, z.id);
      return { ...z, name: ru ? rus : en, alt: ru ? en : rus };
    });
    named.sort((a, b) => GROUP_ORDER.indexOf(a.g) - GROUP_ORDER.indexOf(b.g) || a.name.localeCompare(b.name));
    const idx: Partial<Record<CalloutGroup, number>> = {};
    return named.map((z) => {
      const i = (idx[z.g] = (idx[z.g] ?? -1) + 1);
      return { ...z, color: zoneColor(z.g, i) };
    });
  }, [loaded, level, map, ru]);

  const needle = q.trim().toLowerCase();
  const visible = (z: Zone) => (group === "all" || z.g === group) && (!needle || `${z.name} ${z.alt} ${z.id}`.toLowerCase().includes(needle));
  const shown = zones.filter(visible);
  const selected = zones.find((z) => z.id === sel) ?? null;

  // Yozuvlar ustma-ust tushmasin: katta joylar (plentlar birinchi) yoziladi, to'qnashgan kichigi tashlanadi
  const labelIds = useMemo(() => {
    const boxes: [number, number, number, number][] = [];
    const out = new Set<string>();
    const order = shown
      .filter((z) => z.id !== sel)
      .map((z) => ({ z, a: (z.id.startsWith("Bombsite") ? 1e9 : 0) + z.p.reduce((s, pts) => s + polyArea(pts), 0) }))
      .sort((x, y) => y.a - x.a);
    for (const { z } of order) {
      const w = Math.max(z.name.length * 14, z.alt.length * 11.5) + 10;
      const b: [number, number, number, number] = [z.l[0] - w / 2, z.l[1] - 30, z.l[0] + w / 2, z.l[1] + 28];
      if (boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1])) continue;
      boxes.push(b);
      out.add(z.id);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shown zones/needle/group dan kelib chiqadi
  }, [zones, needle, group, sel]);

  const choose = (id: string, scroll?: boolean) => {
    setSel((s) => (s === id ? null : id));
    if (scroll && radar.current && radar.current.getBoundingClientRect().top < 0) radar.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-4">
      {/* Xaritalar */}
      <div data-tour="callouts-maps" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
        {CALLOUT_MAPS.map((m) => {
          const active = m === map;
          return (
            <button
              key={m}
              type="button"
              onClick={() => pick(m)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl py-1.5 pl-1.5 pr-3.5 text-sm font-bold transition active:scale-95",
                active ? "bg-neon text-on-neon shadow-[0_8px_20px_-10px_rgb(29_92_141/0.7)]" : "bg-surface text-fg shadow-[0_4px_14px_-10px_rgb(16_42_67/0.4)] ring-1 ring-line",
              )}
            >
              <MapBadge map={m} className="size-8 rounded-[10px] text-[11px]" />
              {mapMeta(m).name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        {/* Radar */}
        <div ref={radar} className="scroll-mt-20 space-y-3 lg:sticky lg:top-20">
          <div data-tour="callouts-radar" className="overflow-hidden rounded-[1.75rem] bg-surface p-2 shadow-[0_10px_30px_-18px_rgb(16_42_67/0.45)] ring-1 ring-line">
            <div className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-[#0d1826]">
              {loaded ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- statik radar, o'lchami SVG bilan bir xil bo'lishi kerak */}
                  <img src={`/callouts/${map}${level === "lower" ? "_lower" : ""}.webp`} alt={mapMeta(map).name} className="absolute inset-0 size-full select-none" draggable={false} />
                  <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="absolute inset-0 size-full">
                    {zones.map((z) => {
                      const on = visible(z);
                      const isSel = z.id === sel;
                      return (
                        <g key={z.id} onClick={() => choose(z.id)} className="cursor-pointer">
                          {z.p.map((pts, k) => (
                            <polygon
                              key={k}
                              points={pts}
                              fill={z.color}
                              fillOpacity={isSel ? 0.85 : !on ? 0.06 : sel ? 0.28 : 0.5}
                              stroke={isSel ? "#fff" : z.color}
                              strokeOpacity={isSel ? 1 : on ? 0.9 : 0.15}
                              strokeWidth={isSel ? 5 : 2}
                              strokeLinejoin="round"
                              className="transition-[fill-opacity,stroke-opacity] duration-200"
                            />
                          ))}
                        </g>
                      );
                    })}
                    {labels &&
                      zones
                        .filter((z) => labelIds.has(z.id))
                        .map((z) => (
                          <text key={z.id} x={z.l[0]} y={z.l[1]} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none select-none fill-white text-[25px] font-extrabold" style={{ paintOrder: "stroke", stroke: "rgb(8 16 28 / 0.85)", strokeWidth: 6 }}>
                            <tspan x={z.l[0]} dy="-0.45em">{z.name}</tspan>
                            <tspan x={z.l[0]} dy="1.15em" className="fill-white/80 text-[20px] font-bold">{z.alt}</tspan>
                          </text>
                        ))}
                    {selected && (
                      <g className="pointer-events-none">
                        <text x={selected.l[0]} y={selected.l[1]} textAnchor="middle" dominantBaseline="middle" className="select-none fill-white text-[38px] font-black" style={{ paintOrder: "stroke", stroke: "rgb(8 16 28 / 0.9)", strokeWidth: 9 }}>
                          <tspan x={selected.l[0]} dy="-0.4em">{selected.name}</tspan>
                          <tspan x={selected.l[0]} dy="1.1em" className="fill-white/85 text-[28px] font-extrabold">{selected.alt}</tspan>
                        </text>
                      </g>
                    )}
                  </svg>
                </>
              ) : (
                <div className="absolute inset-0 grid place-items-center text-sm font-medium text-white/60">{failed === map ? t("Xaritani yuklab bo'lmadi") : t("Yuklanmoqda…")}</div>
              )}

              {/* Radar ustidagi tugmalar */}
              <div className="absolute inset-x-2 top-2 flex items-start gap-2">
                {hasLower && (
                  <div className="flex rounded-full bg-black/45 p-0.5 text-xs font-bold text-white backdrop-blur">
                    {(["upper", "lower"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          setLevel(l);
                          setSel(null);
                        }}
                        className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 transition", level === l ? "bg-white text-[#102a43]" : "text-white/80")}
                      >
                        {l === "upper" && <Layers className="size-3.5" />}
                        {l === "upper" ? t("Yuqori qavat") : t("Pastki qavat")}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setLabels((v) => !v)}
                  aria-pressed={labels}
                  className={cn("ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur transition", labels ? "bg-white text-[#102a43]" : "bg-black/45 text-white/85")}
                >
                  <Tags className="size-3.5" />
                  {t("Nomlar")}
                </button>
              </div>
            </div>

            {/* Tanlangan joy */}
            <div className="flex min-h-[64px] items-center gap-3 px-3 pb-1.5 pt-3">
              {selected ? (
                <>
                  <span className="size-10 shrink-0 rounded-xl shadow-inner" style={{ background: selected.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-extrabold leading-tight">{selected.name}</p>
                    <p className="truncate text-[13px] text-muted">
                      {selected.alt} · {GROUPS[selected.g][ru ? "ru" : "uz"]}
                    </p>
                  </div>
                  <button type="button" onClick={() => setSel(null)} className="grid size-9 shrink-0 place-items-center rounded-full bg-fg/[0.06] text-muted" aria-label={t("Yopish")}>
                    <X className="size-4" />
                  </button>
                </>
              ) : (
                <p className="px-1 text-[13px] text-muted">{t("Xaritadagi rangli joyni yoki ro'yxatdagi nomni bosing — u ajralib ko'rinadi.")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Qidiruv va ro'yxat */}
        <div className="space-y-3">
          <label data-tour="callouts-search" className="flex h-11 items-center gap-2 rounded-2xl bg-surface px-4 shadow-[0_4px_14px_-10px_rgb(16_42_67/0.4)] ring-1 ring-line focus-within:ring-2 focus-within:ring-neon">
            <Search className="size-4 shrink-0 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Joy nomini qidiring")} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle" />
            {q && (
              <button type="button" onClick={() => setQ("")} className="text-muted" aria-label={t("Tozalash")}>
                <X className="size-4" />
              </button>
            )}
          </label>

          <div data-tour="callouts-groups" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
            {(["all", ...GROUP_ORDER] as const).map((g) => {
              const active = group === g;
              const count = g === "all" ? zones.length : zones.filter((z) => z.g === g).length;
              if (g !== "all" && !count) return null;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition", active ? "bg-fg text-bg" : "bg-surface text-fg ring-1 ring-line")}
                >
                  {g !== "all" && <span className="size-2.5 rounded-full" style={{ background: `hsl(${GROUPS[g].hue} ${GROUPS[g].sat}% 50%)` }} />}
                  {g === "all" ? t("Hammasi") : GROUPS[g][ru ? "ru" : "uz"]}
                  <span className={cn("text-xs", active ? "text-bg/70" : "text-subtle")}>{count}</span>
                </button>
              );
            })}
          </div>

          <div data-tour="callouts-list" className="space-y-3">
            {loaded && !shown.length && <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted ring-1 ring-line">{t("Bunday nomli joy topilmadi.")}</p>}
            {GROUP_ORDER.map((g) => {
              const list = shown.filter((z) => z.g === g);
              if (!list.length) return null;
              return (
                <section key={g}>
                  <h3 className="mb-1.5 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wide text-muted">
                    <span className="size-2 rounded-full" style={{ background: `hsl(${GROUPS[g].hue} ${GROUPS[g].sat}% 50%)` }} />
                    {GROUPS[g][ru ? "ru" : "uz"]}
                    <span className="font-semibold text-subtle">{list.length}</span>
                  </h3>
                  <div className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_6px_18px_-14px_rgb(16_42_67/0.35)] ring-1 ring-line">
                    {list.map((z) => {
                      const active = z.id === sel;
                      return (
                        <button key={z.id} type="button" onClick={() => choose(z.id, true)} className={cn("flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition", active ? "bg-neon/[0.07]" : "hover:bg-fg/[0.03]")}>
                          <span className={cn("size-7 shrink-0 rounded-lg", active && "ring-2 ring-neon ring-offset-2 ring-offset-surface")} style={{ background: z.color }} />
                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-sm", active ? "font-bold text-neon" : "font-semibold")}>{z.name}</span>
                            <span className="block truncate text-xs text-muted">{z.alt}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="px-1 text-[11px] leading-relaxed text-subtle">{t("Joylar o'yinning o'z xarita ma'lumotidan (Valve nav) olingan. Ruscha nomlar — o'yinchilar orasida ko'p ishlatiladigan atamalar.")}</p>
        </div>
      </div>
    </div>
  );
}
