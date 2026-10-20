import { Badge } from "@/components/ui/primitives";
import type { MatchRow } from "@/lib/types";

export function ResultBadge({ result }: { result: MatchRow["result"] }) {
  if (result === "win") return <Badge tone="neon">G&apos;alaba</Badge>;
  if (result === "loss") return <Badge tone="danger">Mag&apos;lubiyat</Badge>;
  if (result === "tie") return <Badge tone="warn">Durang</Badge>;
  return <Badge>Natija noma&apos;lum</Badge>;
}

export function DemoBadge({ a }: { a: MatchRow["demo_availability"] }) {
  switch (a) {
    case "uploaded":
      return <Badge tone="violet">Demo tahlil qilingan</Badge>;
    case "available":
      return <Badge tone="neon">Demo Valve serverida</Badge>;
    case "expired":
      return <Badge tone="warn">Valve demo muddati o&apos;tgan</Badge>;
    case "missing":
      return <Badge>Demo yo&apos;q</Badge>;
    default:
      return <Badge>Demo holati noma&apos;lum</Badge>;
  }
}

export function SideBadge({ side }: { side: "CT" | "T" | null }) {
  if (!side) return null;
  return <Badge tone={side === "CT" ? "ct" : "t"}>{side}</Badge>;
}
