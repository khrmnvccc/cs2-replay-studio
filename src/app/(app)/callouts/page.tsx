import { CalloutsView } from "@/components/callouts-view";
import { CALLOUT_MAPS, type CalloutMap } from "@/lib/callouts";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Xarita joy nomlari") };
}

export default async function CalloutsPage({ searchParams }: { searchParams: Promise<{ map?: string }> }) {
  const { map } = await searchParams;
  const initial = (CALLOUT_MAPS as readonly string[]).includes(map ?? "") ? (map as CalloutMap) : CALLOUT_MAPS[0];
  return <CalloutsView initialMap={initial} />;
}
