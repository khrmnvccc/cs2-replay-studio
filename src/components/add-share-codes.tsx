"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, toastError } from "@/lib/client/api";
import { useT } from "@/components/i18n";

// CS2 → Watch → Your Matches → match → "Share" (yoki share code) ni shu yerga joylash.
export function AddShareCodes({ gcOnline }: { gcOnline: boolean }) {
  const router = useRouter();
  const t = useT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ added: number; skipped: number }>("/api/matches", { method: "POST", json: { text } });
      toast.success(r.added ? t("{n} ta match qo'shildi", { n: r.added }) + (r.skipped ? ", " + t("{n} tasi oldin bor edi", { n: r.skipped }) : "") : t("Bu matchlar allaqachon qo'shilgan"));
      setText("");
      router.refresh();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="panel space-y-3 p-4">
      <div>
        <div className="text-sm font-semibold">{t("Share code orqali match qo'shish")}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {t("Istalgan kompyuterda (kompyuterxonada ham): CS2 → Watch → Your Matches → matchni tanlang → share code'ni nusxalang (CSGO-…). Bir nechtasini birdan joylash mumkin.")}
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        required
        spellCheck={false}
        placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
        className="w-full resize-y rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 font-mono text-base text-fg placeholder:text-subtle transition focus:border-ct/60 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-ct/15 sm:text-sm"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">
          {gcOnline ? t("Sana, hisob va demo Valve'dan avtomatik olinadi.") : t("Valve bilan bog'lanadigan bot worker hozir onlayn emas — match qo'shiladi, tafsilotlar bot ulanganda olinadi.")}
        </p>
        <Button type="submit" variant="primary" disabled={busy || !text.trim()} className="w-full sm:w-auto">
          <Plus /> {t("Qo'shish")}
        </Button>
      </div>
    </form>
  );
}
