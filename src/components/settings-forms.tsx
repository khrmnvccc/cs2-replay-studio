"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Link2, Save, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";
import { Picker } from "@/components/ui/picker";
import { Switch } from "@/components/ui/switch";
import { api, toastError } from "@/lib/client/api";
import type { UserSettings } from "@/lib/types";
import { useT } from "@/components/i18n";
import { cn } from "@/lib/utils";
import { askConfirm } from "@/components/ui/confirm";

export function HistoryForm({ enabled, lastShareCode }: { enabled: boolean; lastShareCode: string | null }) {
  const router = useRouter();
  const t = useT();
  const [authCode, setAuthCode] = useState("");
  const [shareCode, setShareCode] = useState(lastShareCode ?? "");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/match-history", { method: "POST", json: { authCode, shareCode } });
      toast.success(t("Match tarixi ulandi — matchlar yuklanmoqda"));
      setAuthCode("");
      router.refresh();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  const disconnect = async () => {
    if (!(await askConfirm(t("Match tarixini uzish? Saqlangan authentication code o'chiriladi."), { ok: t("Uzish") }))) return;
    try {
      await api("/api/match-history", { method: "DELETE" });
      toast.success(t("Uzildi"));
      router.refresh();
    } catch (err) {
      toastError(err);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-[13px] leading-relaxed text-muted">{t("Bir martalik sozlash — keyin o'yinlaringiz o'zi chiqadi. Ikki qadam:")}</p>

      <Step n={1} title="Authentication Code" tour="settings-auth">
        <ol className="space-y-2 text-[13px] leading-relaxed text-muted">
          <li>
            <b className="text-fg">1.</b> {t("Steam'dagi CS2 match tarixi sahifasini oching:")}
          </li>
        </ol>
        <a
          href="https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl bg-neon px-4 py-3 text-sm font-bold text-on-neon transition active:scale-[0.99]"
        >
          {t("Steam sahifasini ochish")} <ExternalLink className="size-4" />
        </a>
        <ol className="space-y-2 text-[13px] leading-relaxed text-muted">
          <li>
            <b className="text-fg">2.</b> {t("Steam so'rasa, hisobingizga kiring.")}
          </li>
          <li>
            <b className="text-fg">3.</b> {t("Sahifadan shu bo'limni toping:")} <b className="text-fg">&quot;Access to Your Match History&quot;</b>.
          </li>
          <li>
            <b className="text-fg">4.</b> {t("Kod ko'rinib tursa — nusxalang. Bo'lmasa avval")} <b className="text-fg">&quot;Create Authentication Code&quot;</b> {t("tugmasini bosing, keyin chiqqan kodni nusxalang.")}
          </li>
        </ol>
        <SteamPageMock />
        <Field label={t("Kodni shu yerga joylang")} hint={t("Bu Steam paroli emas — faqat match tarixini o'qishga ruxsat beradi.")}>
          <Input value={authCode} onChange={(e) => setAuthCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGHI-JKLM" autoComplete="off" spellCheck={false} required pattern="[A-Z0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{4}" className="font-mono" />
        </Field>
      </Step>

      <Step n={2} title="Match Sharing Code" tour="settings-share">
        <ol className="space-y-2 text-[13px] leading-relaxed text-muted">
          <li>
            <b className="text-fg">1.</b> {t("Counter-Strike 2'ni oching.")}
          </li>
          <li>
            <b className="text-fg">2.</b> {t("Tepadagi")} <b className="text-fg">Watch</b> {t("bo'limiga, keyin")} <b className="text-fg">Your Matches</b> {t("ga kiring.")}
          </li>
          <li>
            <b className="text-fg">3.</b> {t("Oxirgi 28 kundagi istalgan o'yinni tanlang. Ro'yxatdagi eng eskisini tanlasangiz, ko'proq o'yin olinadi.")}
          </li>
          <li>
            <b className="text-fg">4.</b> {t("Pastdagi")} <b className="text-fg">{t("nusxa olish belgisini")}</b> {t("bosing va kodni shu yerga joylang.")}
          </li>
        </ol>
        <YourMatchesMock />
        <Field label={t("Share code")} hint={t("Bitta kod yetadi. Shundan keyingi har bir o'yin o'zi chiqadi. Share code maxfiy emas — uni lobbidagi hamma ko'radi.")}>
          <Input value={shareCode} onChange={(e) => setShareCode(e.target.value.trim())} placeholder="CSGO-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" autoComplete="off" spellCheck={false} required className="font-mono" />
        </Field>
      </Step>

      <p className="text-xs leading-relaxed text-subtle">{t("Kodlar Valve'da tekshiriladi va serverda shifrlangan holda saqlanadi.")}</p>
      <div data-tour="settings-submit" className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" loading={busy} className="flex-1 sm:flex-none">
          <Link2 /> {enabled ? t("Kodlarni yangilash") : t("Match tarixini ulash")}
        </Button>
        {enabled && (
          <Button type="button" variant="danger" onClick={disconnect}>
            <Unlink /> {t("Uzish")}
          </Button>
        )}
      </div>
    </form>
  );
}

function Step({ n, title, tour, children }: { n: number; title: string; tour?: string; children: React.ReactNode }) {
  return (
    <section data-tour={tour} className="space-y-3 rounded-[1.25rem] bg-surface-2 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-white">{n}</span>
        <h3 className="text-[15px] font-extrabold tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** Steam qo'llab-quvvatlash sahifasining soddalashtirilgan ko'rinishi — kod qayerda turishini ko'rsatadi. */
function SteamPageMock() {
  const t = useT();
  return (
    <div className="overflow-hidden rounded-2xl bg-[#1b2838] p-3 font-sans text-[10px] leading-snug text-[#8f98a0]" aria-hidden>
      <div className="text-[11px] font-semibold text-white/90">Steam Support · Counter-Strike 2</div>
      <div className="mt-2 rounded-lg bg-black/20 p-2.5">
        <div className="font-semibold text-[#66c0f4]">Game Authentication Codes</div>
        <div className="mt-2 font-semibold text-[#66c0f4]">Access to Your Match History</div>
        <div className="mt-1 h-1.5 w-11/12 rounded bg-white/10" />
        <div className="mt-1 h-1.5 w-2/3 rounded bg-white/10" />
        <div className="mt-2 text-[9px]">Your most recently completed match token: CSGO-XXXXX-…</div>
        <div className="relative mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] text-white ring-2 ring-accent">
          Authentication Code: <span className="font-mono font-bold">ABCD-EFGHI-JKLM</span>
          <span className="absolute -right-2 -top-2.5 rounded-full bg-accent px-1.5 py-px text-[9px] font-bold">{t("shu kod")}</span>
        </div>
      </div>
    </div>
  );
}

/** CS2 "Watch → Your Matches" oynasining soddalashtirilgan ko'rinishi — nusxa olish tugmasi joyi. */
function YourMatchesMock() {
  const t = useT();
  return (
    <div className="overflow-hidden rounded-2xl bg-[#1d2127] p-3 text-[10px] text-white/70" aria-hidden>
      <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider">
        <span>Play</span>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-white ring-2 ring-accent">Watch</span>
        <span>Inventory</span>
      </div>
      <div className="mt-2 flex gap-2">
        <div className="w-24 space-y-1">
          <div className="rounded bg-white/15 px-1.5 py-1 text-[9px] font-bold text-white ring-2 ring-accent">Your Matches</div>
          {["Mirage 13:9", "Nuke 10:13", "Inferno 13:4"].map((x, i) => (
            <div key={x} className={cn("rounded px-1.5 py-1", i === 2 ? "bg-white/15 text-white" : "bg-white/5")}>
              {x}
            </div>
          ))}
          <div className="pl-1 text-[8px] text-accent">↑ {t("eng eskisi")}</div>
        </div>
        <div className="flex flex-1 flex-col justify-between rounded bg-white/5 p-2">
          <div className="space-y-1">
            <div className="h-1.5 w-3/4 rounded bg-white/10" />
            <div className="h-1.5 w-1/2 rounded bg-white/10" />
            <div className="h-1.5 w-2/3 rounded bg-white/10" />
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <span className="rounded bg-[#4c8a3c] px-1.5 py-0.5 text-[8px] font-bold text-white">DOWNLOAD</span>
            <span className="relative grid size-5 place-items-center rounded bg-white/15 text-white ring-2 ring-accent">
              <Copy className="size-3" />
              <span className="absolute -top-5 right-0 whitespace-nowrap rounded-full bg-accent px-1.5 py-px text-[8px] font-bold">{t("nusxa olish")}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreferencesForm({ initial }: { initial: UserSettings }) {
  const router = useRouter();
  const t = useT();
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof UserSettings>(k: K, v: UserSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/settings", { method: "PATCH", json: s });
      toast.success(t("Sozlamalar saqlandi"));
      router.refresh();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="space-y-8">
      <div>
        <h3 className="mb-4 text-base font-semibold">{t("Video sifati")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Ruxsat (resolution)")}>
            <Picker<UserSettings["video_resolution"]>
              value={s.video_resolution}
              title={t("Ruxsat (resolution)")}
              onChange={(v) => set("video_resolution", v)}
              options={[
                { value: "1280x720", label: "720p", hint: "1280 × 720" },
                { value: "1920x1080", label: "1080p", hint: "1920 × 1080" },
                { value: "2560x1440", label: "1440p", hint: "2560 × 1440" },
              ]}
            />
          </Field>
          <Field label={t("Kadr tezligi (FPS)")} hint={t("Yuqori FPS render vaqtini oshiradi.")}>
            <Picker<UserSettings["video_fps"]>
              value={s.video_fps}
              title={t("Kadr tezligi (FPS)")}
              onChange={(v) => set("video_fps", v)}
              options={[
                { value: 30, label: "30 fps" },
                { value: 60, label: "60 fps" },
                { value: 120, label: "120 fps" },
              ]}
            />
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-base font-semibold">{t("Clip davomiyligi")}</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t("Kill'dan oldin: {n} s", { n: s.clip_pre_seconds })}>
            <input type="range" min={0} max={15} step={0.5} value={s.clip_pre_seconds} onChange={(e) => set("clip_pre_seconds", Number(e.target.value))} className="w-full" />
          </Field>
          <Field label={t("Kill'dan keyin: {n} s", { n: s.clip_post_seconds })}>
            <input type="range" min={0} max={15} step={0.5} value={s.clip_post_seconds} onChange={(e) => set("clip_post_seconds", Number(e.target.value))} className="w-full" />
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-base font-semibold">{t("Saqlash")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Demo fayllarni saqlash muddati")} hint={t("Eski demo fayllar o'chiriladi, killlar va tayyor kliplar qoladi.")}>
            <Picker<number>
              value={s.retention_days}
              title={t("Demo fayllarni saqlash muddati")}
              onChange={(v) => set("retention_days", v)}
              options={[7, 14, 30, 60, 90, 180, 365].map((d) => ({ value: d, label: t("{n} kun", { n: d }) }))}
            />
          </Field>
          <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5 text-sm">
            <span className="flex-1">
              <span className="font-medium">{t("Valve demolarini avtomatik yuklab olish")}</span>
              <span className="mt-0.5 block text-xs text-muted">{t("Yangi match topilganda uning demosi avtomatik yuklanib, killlar tahlil qilinadi.")}</span>
            </span>
            <Switch checked={s.auto_download_demos} onChange={(v) => set("auto_download_demos", v)} label={t("Valve demolarini avtomatik yuklab olish")} />
          </div>
        </div>
      </div>
      <Button type="submit" variant="primary" loading={busy}>
        <Save /> {t("Saqlash")}
      </Button>
    </form>
  );
}
