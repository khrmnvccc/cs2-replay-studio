import { Badge } from "@/components/ui/primitives";
import { makeT, type Lang } from "@/lib/i18n";
import type { MatchRow } from "@/lib/types";

export function ResultBadge({ result, lang = "uz" }: { result: MatchRow["result"]; lang?: Lang }) {
  const t = makeT(lang);
  if (result === "win") return <Badge tone="neon">{t("G'alaba")}</Badge>;
  if (result === "loss") return <Badge tone="danger">{t("Mag'lubiyat")}</Badge>;
  if (result === "tie") return <Badge tone="warn">{t("Durang")}</Badge>;
  return <Badge>{t("Natija noma'lum")}</Badge>;
}

export function DemoBadge({ a, lang = "uz" }: { a: MatchRow["demo_availability"]; lang?: Lang }) {
  const t = makeT(lang);
  switch (a) {
    case "uploaded":
      return <Badge tone="violet">{t("Demo tahlil qilingan")}</Badge>;
    case "available":
      return <Badge tone="neon">{t("Demo Valve serverida")}</Badge>;
    case "expired":
      return <Badge tone="warn">{t("Valve demo muddati o'tgan")}</Badge>;
    case "missing":
      return <Badge>{t("Demo yo'q")}</Badge>;
    default:
      return <Badge>{t("Demo holati noma'lum")}</Badge>;
  }
}

export function SideBadge({ side }: { side: "CT" | "T" | null }) {
  if (!side) return null;
  return <Badge tone={side === "CT" ? "ct" : "t"}>{side}</Badge>;
}
