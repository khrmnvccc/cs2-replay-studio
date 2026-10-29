import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { onlineCapabilities } from "@/lib/server/data";
import { pageUser } from "@/lib/server/session";
import { userDb } from "@/lib/server/supabase";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("Tizim holati") };
}

const ROWS = [
  { cap: "parse", title: "Demo tahlili", desc: "Worker: parse" },
  { cap: "sync", title: "Valve demo yuklash", desc: "Worker: sync (match tarixini sayt o'zi Steam kaliti bilan oladi)" },
  { cap: "gc", title: "Valve Game Coordinator", desc: "Alohida Steam bot akkaunt (CS2 litsenziyali) bilan worker: gc" },
  { cap: "zip", title: "ZIP eksport", desc: "Worker: zip" },
  { cap: "render", title: "MP4 render", desc: "Windows + CS2 + HLAE + CS Demo Manager + FFmpeg: render" },
];

export default async function SystemPage() {
  const user = await pageUser();
  const { t } = await getT();
  const db = await userDb(user.userId);
  const online = await onlineCapabilities(db);
  return (
    <div className="space-y-8">
      <div>
        <div className="label">{t("Infratuzilma")}</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{t("Tizim holati")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("Har bir funksiya qaysi komponentga tayanishi va hozir u onlayn ekanligi. Bulutdagi worker har ~10 daqiqada ishga tushadi.")}</p>
      </div>
      <section>
        <SectionTitle eyebrow={t("Workerlar")} title={t("Komponentlar")} />
        <Card className="divide-y divide-line">
          <div className="flex items-center gap-4 p-4">
            <CheckCircle2 className="size-5 text-neon" />
            <div className="flex-1">
              <div className="font-medium">Web server, Steam OpenID, Supabase</div>
              <div className="text-xs text-muted">{t("Bu sahifa ochilgani — server va baza ishlayotganini bildiradi.")}</div>
            </div>
          </div>
          {ROWS.map((r) => {
            const n = online[r.cap] ?? 0;
            return (
              <div key={r.cap} className="flex items-center gap-4 p-4">
                {n > 0 ? <CheckCircle2 className="size-5 text-neon" /> : r.cap === "render" || r.cap === "gc" ? <CircleDashed className="size-5 text-warn" /> : <XCircle className="size-5 text-danger" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t(r.title)}</div>
                  <div className="break-words text-xs text-muted">{t(r.desc)}</div>
                </div>
                <span className="font-mono text-xs text-muted">{n > 0 ? t("{n} ta onlayn", { n }) : t("oflayn")}</span>
              </div>
            );
          })}
        </Card>
      </section>
      <Notice tone="violet" title={t("Nega render alohida?")}>
        {t("CS2 demo'sidan video olishning yagona haqiqiy yo'li — o'yin klientida demo'ni ijro etib, kadrlarni yozib olish. Bu GPU va Windows'dagi CS2 + HLAE'ni talab qiladi, shuning uchun bulut serverda bajarib bo'lmaydi. Render worker ulanmaguncha cliplar navbatda turadi.")}
      </Notice>
    </div>
  );
}
