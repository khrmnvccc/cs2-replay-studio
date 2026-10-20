"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2, Save, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/primitives";
import { api, toastError } from "@/lib/client/api";
import type { UserSettings } from "@/lib/types";

export function HistoryForm({ enabled, lastShareCode }: { enabled: boolean; lastShareCode: string | null }) {
  const router = useRouter();
  const [authCode, setAuthCode] = useState("");
  const [shareCode, setShareCode] = useState(lastShareCode ?? "");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/match-history", { method: "POST", json: { authCode, shareCode } });
      toast.success("Match tarixi ulandi — matchlar yuklanmoqda");
      setAuthCode("");
      router.refresh();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  const disconnect = async () => {
    if (!confirm("Match tarixini uzish? Saqlangan authentication code o'chiriladi.")) return;
    try {
      await api("/api/match-history", { method: "DELETE" });
      toast.success("Uzildi");
      router.refresh();
    } catch (err) {
      toastError(err);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
        <li>
          Steam&apos;da{" "}
          <a className="inline-flex items-center gap-1 text-fg underline decoration-white/30 underline-offset-2 hover:text-neon" href="https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128" target="_blank" rel="noopener noreferrer">
            CS2 match history sahifasini <ExternalLink className="size-3" />
          </a>{" "}
          oching va <b className="text-fg">Authentication Code</b> yarating (XXXX-XXXXX-XXXX).
        </li>
        <li>Xuddi shu sahifadan oxirgi matchingizning share code&apos;ini nusxalang (CSGO-…). U CS2 → Watch → Your Matches da ham bor.</li>
        <li>Ikkalasini shu yerga kiriting. Kod Valve&apos;da tekshiriladi va serverda shifrlangan holda saqlanadi.</li>
      </ol>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Game Authentication Code" hint="Bu Steam paroli emas — faqat match tarixini o'qishga ruxsat beradi.">
          <Input value={authCode} onChange={(e) => setAuthCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGHI-JKLM" autoComplete="off" spellCheck={false} required pattern="[A-Z0-9]{4}-[A-Z0-9]{5}-[A-Z0-9]{4}" />
        </Field>
        <Field label="Oxirgi match share code">
          <Input value={shareCode} onChange={(e) => setShareCode(e.target.value.trim())} placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx" autoComplete="off" spellCheck={false} required />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" loading={busy}>
          <Link2 /> {enabled ? "Kodlarni yangilash" : "Match tarixini ulash"}
        </Button>
        {enabled && (
          <Button type="button" variant="danger" onClick={disconnect}>
            <Unlink /> Uzish
          </Button>
        )}
      </div>
    </form>
  );
}

export function PreferencesForm({ initial }: { initial: UserSettings }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof UserSettings>(k: K, v: UserSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/settings", { method: "PATCH", json: s });
      toast.success("Sozlamalar saqlandi");
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
        <h3 className="mb-4 font-display text-xl font-semibold uppercase">Video sifati</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ruxsat (resolution)">
            <Select value={s.video_resolution} onChange={(e) => set("video_resolution", e.target.value as UserSettings["video_resolution"])}>
              <option value="1280x720">1280 × 720 (720p)</option>
              <option value="1920x1080">1920 × 1080 (1080p)</option>
              <option value="2560x1440">2560 × 1440 (1440p)</option>
            </Select>
          </Field>
          <Field label="Kadr tezligi (FPS)" hint="Yuqori FPS render vaqtini oshiradi.">
            <Select value={s.video_fps} onChange={(e) => set("video_fps", Number(e.target.value) as UserSettings["video_fps"])}>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
              <option value={120}>120 fps</option>
            </Select>
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-4 font-display text-xl font-semibold uppercase">Clip davomiyligi</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={`Kill'dan oldin: ${s.clip_pre_seconds} s`}>
            <input type="range" min={0} max={15} step={0.5} value={s.clip_pre_seconds} onChange={(e) => set("clip_pre_seconds", Number(e.target.value))} className="w-full" />
          </Field>
          <Field label={`Kill'dan keyin: ${s.clip_post_seconds} s`}>
            <input type="range" min={0} max={15} step={0.5} value={s.clip_post_seconds} onChange={(e) => set("clip_post_seconds", Number(e.target.value))} className="w-full" />
          </Field>
        </div>
      </div>
      <div>
        <h3 className="mb-4 font-display text-xl font-semibold uppercase">Saqlash</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Demo fayllarni saqlash muddati" hint="Muddati o'tgan demo fayllar storage'dan o'chiriladi; kill eventlar va tayyor cliplar qoladi.">
            <Select value={s.retention_days} onChange={(e) => set("retention_days", Number(e.target.value))}>
              {[7, 14, 30, 60, 90, 180, 365].map((d) => (
                <option key={d} value={d}>
                  {d} kun
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/50 p-3.5 text-sm">
            <input type="checkbox" className="mt-0.5" checked={s.auto_download_demos} onChange={(e) => set("auto_download_demos", e.target.checked)} />
            <span>
              <span className="font-medium">Valve demolarini avtomatik yuklab olish</span>
              <span className="mt-0.5 block text-xs text-muted">GC bot demo havolasini topsa, demo yuklanib darhol tahlil qilinadi (storage hajmini oshiradi).</span>
            </span>
          </label>
        </div>
      </div>
      <Button type="submit" variant="primary" loading={busy}>
        <Save /> Saqlash
      </Button>
    </form>
  );
}
