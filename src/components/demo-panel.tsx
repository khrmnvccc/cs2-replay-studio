"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudDownload, FileDown, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { JobItem } from "@/components/job-list";
import { api, toastError } from "@/lib/client/api";
import { useJobs } from "@/lib/client/use-jobs";
import type { DemoFileRow, JobRow, MatchRow } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { useI18n } from "@/components/i18n";

const STATUS: Record<DemoFileRow["status"], { label: string; tone: "neutral" | "neon" | "violet" | "danger" | "warn" }> = {
  uploading: { label: "Yuklanmoqda", tone: "neutral" },
  uploaded: { label: "Tahlil navbatida", tone: "warn" },
  parsing: { label: "Tahlil qilinmoqda", tone: "violet" },
  parsed: { label: "Tahlil qilingan", tone: "neon" },
  failed: { label: "Xato", tone: "danger" },
  expired: { label: "Fayl o'chirilgan", tone: "neutral" },
};

export function DemoPanel({ match, demos, jobs: initial, online }: { match: MatchRow; demos: DemoFileRow[]; jobs: JobRow[]; online: Record<string, number> }) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const { jobs, track } = useJobs(initial, { onDone: (j) => (j.status === "succeeded" ? toast.success(t("Tayyor")) : toast.error(t(j.error ?? "Xato"))) });
  const active = jobs.filter((j) => j.status === "queued" || j.status === "running");
  const failed = jobs.filter((j) => j.status === "failed").slice(0, 1);

  const call = async (key: string, url: string, method = "POST") => {
    setBusy(key);
    try {
      const r = await api<{ job?: JobRow }>(url, { method });
      if (r.job) track(r.job);
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {demos.map((d) => (
        <div key={d.id} className="rounded-xl border border-line bg-surface-2/60 p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS[d.status].tone}>{t(STATUS[d.status].label)}</Badge>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{d.original_name}</span>
            <span className="text-xs text-subtle">{formatBytes(d.size_bytes)}</span>
          </div>
          <div className="mt-1 text-xs text-subtle">
            {t("Yuklangan")}: {formatDate(d.created_at, true, lang)} · tickrate {d.tickrate}
          </div>
          {d.error && <p className="mt-2 text-xs text-danger/90">{t(d.error)}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {d.status !== "expired" && (
              <Button size="sm" variant="secondary" asChild>
                <a href={`/api/demos/${d.id}/download`}>
                  <FileDown /> {t("Demoni yuklab olish")}
                </a>
              </Button>
            )}
            {(d.status === "parsed" || d.status === "failed") && (
              <Button size="sm" variant="ghost" loading={busy === `re${d.id}`} onClick={() => call(`re${d.id}`, `/api/demos/${d.id}/reparse`)}>
                <RotateCcw /> {t("Qayta tahlil")}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-subtle hover:text-danger"
              loading={busy === `rm${d.id}`}
              onClick={() => confirm(t("Demo va undan yaratilgan kill eventlar hamda cliplar o'chirilsinmi?")) && call(`rm${d.id}`, `/api/demos/${d.id}`, "DELETE")}
            >
              <Trash2 /> {t("O'chirish")}
            </Button>
          </div>
        </div>
      ))}
      {match.demo_availability === "available" && match.demo_url && !demos.length && (
        <div className="rounded-xl border border-neon/20 bg-neon/[0.04] p-3.5 text-sm text-muted">
          {t("Valve replay serverida bu match demo'si mavjud.")}
          <div className="mt-3">
            <Button size="sm" variant="primary" loading={busy === "fetch"} onClick={() => call("fetch", `/api/matches/${match.id}/fetch-demo`)}>
              <CloudDownload /> {t("Valve'dan yuklab, tahlil qilish")}
            </Button>
          </div>
        </div>
      )}
      {[...active, ...failed].map((j) => (
        <JobItem key={j.id} job={j} online={online} onRetried={track} />
      ))}
    </div>
  );
}
