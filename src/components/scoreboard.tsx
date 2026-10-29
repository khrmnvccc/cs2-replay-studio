import type { TFn } from "@/lib/i18n";
import type { ScoreRow } from "@/lib/scoreboard";
import { cn } from "@/lib/utils";

function kdClass(v: number) {
  return v >= 1.5 ? "text-violet" : v >= 1 ? "text-neon" : v >= 0.8 ? "text-warn" : "text-danger";
}

function TeamTable({ name, score, rows, rounds, tone, won, avatars, t }: { name: string; score: number | null; rows: ScoreRow[]; rounds: number; tone: "a" | "b"; won: boolean; avatars: Record<string, string>; t: TFn }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between bg-fg/[0.03] px-4 py-3.5">
        <span className={cn("text-[17px] font-bold", tone === "a" ? "text-ct" : "text-tside")}>{name}</span>
        <span className={cn("font-display text-2xl font-bold tabular-nums", won ? "text-neon" : "text-muted")}>{score ?? "—"}</span>
      </div>
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="border-y border-line text-[11px] font-semibold uppercase tracking-wider text-subtle">
              <th className="px-4 py-2.5 text-left font-semibold">{t("O'yinchi")}</th>
              <th className="w-10 py-2.5 text-center font-semibold">K</th>
              <th className="w-10 py-2.5 text-center font-semibold">D</th>
              <th className="w-10 py-2.5 text-center font-semibold">A</th>
              <th className="w-14 py-2.5 text-center font-semibold">K/D</th>
              <th className="w-14 py-2.5 text-center font-semibold">KPR</th>
              <th className="w-14 py-2.5 pr-4 text-center font-semibold">HS%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const kd = r.deaths ? r.kills / r.deaths : r.kills;
              const avatar = r.steamId ? avatars[r.steamId] : undefined;
              return (
                <tr key={r.key} className={cn(r.isUser && "bg-neon/[0.08]")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 rounded-full" />
                      ) : (
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-bold text-muted">{r.name.slice(0, 1).toUpperCase()}</span>
                      )}
                      <span className={cn("max-w-[9rem] truncate font-semibold sm:max-w-[14rem]", r.isUser && "text-neon")}>{r.name}</span>
                    </div>
                  </td>
                  <td className="text-center font-mono tabular-nums">{r.kills}</td>
                  <td className="text-center font-mono tabular-nums">{r.deaths}</td>
                  <td className="text-center font-mono tabular-nums">{r.assists}</td>
                  <td className={cn("text-center font-mono font-semibold tabular-nums", kdClass(kd))}>{kd.toFixed(2)}</td>
                  <td className="text-center font-mono tabular-nums text-muted">{rounds ? (r.kills / rounds).toFixed(2) : "—"}</td>
                  <td className="pr-4 text-center font-mono tabular-nums text-muted">{r.kills ? `${Math.round((r.headshots / r.kills) * 100)}%` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Scoreboard({ rows, rounds, scoreA, scoreB, avatars, hasUser, t }: { rows: ScoreRow[]; rounds: number; scoreA: number | null; scoreB: number | null; avatars: Record<string, string>; hasUser: boolean; t: TFn }) {
  const a = rows.filter((r) => r.team === "A");
  const b = rows.filter((r) => r.team === "B");
  return (
    <div className="space-y-4">
      <TeamTable name={hasUser ? t("Sizning jamoa") : t("1-jamoa")} score={scoreA} rows={a} rounds={rounds} tone="a" won={(scoreA ?? 0) > (scoreB ?? 0)} avatars={avatars} t={t} />
      <TeamTable name={hasUser ? t("Raqiblar") : t("2-jamoa")} score={scoreB} rows={b} rounds={rounds} tone="b" won={(scoreB ?? 0) > (scoreA ?? 0)} avatars={avatars} t={t} />
    </div>
  );
}
