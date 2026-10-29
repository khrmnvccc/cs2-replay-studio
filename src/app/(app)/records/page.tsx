import { RecordCard } from "@/components/record-card";
import { getT } from "@/lib/i18n/server";
import { listMatches } from "@/lib/server/data";
import { pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import { buildRecords, type KillLite } from "@/lib/records";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Rekordlar") };
}

export default async function RecordsPage() {
  const user = await pageUser();
  const { lang, t } = await getT();
  const db = await userDb(user.userId);
  const [matches, killsRes] = await Promise.all([
    listMatches(db, {}, 1000),
    db.from("kill_events").select("match_id, round_number, tick, is_user_kill, headshot").limit(50000),
  ]);
  const records = buildRecords(matches, (killsRes.data ?? []) as KillLite[]);
  const set = records.filter((r) => r.value != null).length;

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">{t("{a} / {b} ta rekord o'rnatilgan", { a: set, b: records.length })}</p>
      <div data-tour="records-grid" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {records.map((r) => (
          <RecordCard key={r.id} r={r} t={t} lang={lang} />
        ))}
      </div>
      <p className="pt-2 text-center text-xs text-subtle">{t("ADR, reyting va clutch rekordlari tez orada qo'shiladi.")}</p>
    </div>
  );
}
