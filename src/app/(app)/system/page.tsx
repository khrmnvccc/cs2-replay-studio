import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { onlineCapabilities } from "@/lib/server/data";
import { requireUser } from "@/lib/server/http";
import { userDb } from "@/lib/server/supabase";

export const metadata = { title: "Tizim holati" };

const ROWS = [
  { cap: "parse", title: "Demo tahlili", desc: "Linux/Docker worker: WORKER_CAPABILITIES=parse" },
  { cap: "sync", title: "Match tarixi + Valve demo yuklash", desc: "STEAM_API_KEY va APP_ENCRYPTION_KEY bilan worker: sync" },
  { cap: "gc", title: "Valve Game Coordinator", desc: "Alohida Steam bot akkaunt (CS2 litsenziyali) bilan worker: gc" },
  { cap: "zip", title: "ZIP eksport", desc: "Har qanday worker: zip" },
  { cap: "render", title: "MP4 render", desc: "Windows + CS2 + HLAE + CS Demo Manager + FFmpeg: render" },
];

export default async function SystemPage() {
  const user = await requireUser();
  const db = await userDb(user.userId);
  const online = await onlineCapabilities(db);
  return (
    <div className="space-y-8">
      <div>
        <div className="label">Infratuzilma</div>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none">Tizim holati</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Har bir funksiya qaysi komponentga tayanishi va hozir u onlayn ekanligi. Oxirgi 2 daqiqada heartbeat yuborgan workerlar hisoblanadi.</p>
      </div>
      <section>
        <SectionTitle eyebrow="Workerlar" title="Komponentlar" />
        <Card className="divide-y divide-line">
          <div className="flex items-center gap-4 p-4">
            <CheckCircle2 className="size-5 text-neon" />
            <div className="flex-1">
              <div className="font-medium">Web server, Steam OpenID, Supabase</div>
              <div className="text-xs text-muted">Bu sahifa ochilgani — server va baza ishlayotganini bildiradi.</div>
            </div>
          </div>
          {ROWS.map((r) => {
            const n = online[r.cap] ?? 0;
            return (
              <div key={r.cap} className="flex items-center gap-4 p-4">
                {n > 0 ? <CheckCircle2 className="size-5 text-neon" /> : r.cap === "render" || r.cap === "gc" ? <CircleDashed className="size-5 text-warn" /> : <XCircle className="size-5 text-danger" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{r.title}</div>
                  <div className="break-words text-xs text-muted">{r.desc}</div>
                </div>
                <span className="font-mono text-xs text-muted">{n > 0 ? `${n} ta onlayn` : "oflayn"}</span>
              </div>
            );
          })}
        </Card>
      </section>
      <Notice tone="violet" title="Nega render alohida?">
        CS2 demo&apos;sidan video olishning yagona haqiqiy yo&apos;li — o&apos;yin klientida demo&apos;ni ijro etib, kadrlarni yozib olish. Bu GPU va Windows&apos;dagi CS2 + HLAE&apos;ni talab qiladi, shuning uchun Vercel serverless funksiyasida bajarib bo&apos;lmaydi. Render worker ulanmaguncha cliplar navbatda turadi.
      </Notice>
    </div>
  );
}
