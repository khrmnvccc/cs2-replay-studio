import { Compass } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Reels" };

const CHIPS = ["Barchasi", "Triple kill", "Quad kill", "Ace", "Clutch"];

export default async function ReelsPage() {
  const { t } = await getT();
  return (
    <div className="space-y-5">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {CHIPS.map((c, i) => (
          <span key={c} className={i === 0 ? "shrink-0 rounded-full bg-neon px-5 py-2.5 text-[15px] font-semibold text-on-neon" : "shrink-0 rounded-full border border-line bg-surface-2 px-5 py-2.5 text-[15px] font-semibold text-muted"}>
            {t(c)}
          </span>
        ))}
      </div>
      <div className="panel grid place-items-center px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-3xl bg-neon/10 text-neon">
          <Compass className="size-8" />
        </span>
        <h2 className="mt-5 text-xl font-bold">{t("Reels — tez orada")}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{t("Barcha o'yinchilarning eng zo'r lavhalari: triple kill, quad kill va ace'lar qisqa videolarda.")}</p>
      </div>
    </div>
  );
}
