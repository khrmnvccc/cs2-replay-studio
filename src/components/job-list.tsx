"use client";
import { CheckCircle2, CircleAlert, Clock, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { JOB_LABELS_UZ } from "@shared/jobs";
import { Progress } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { api, toastError } from "@/lib/client/api";
import type { JobRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n";

const NEEDS: Record<string, string> = {
  fetch_match_info: "gc",
  render_clip: "render",
};
// Oddiy foydalanuvchiga texnik tafsilotsiz: bulutdagi xizmat ishni o'zi oladi
const NEEDS_TEXT: Record<string, string> = {
  render: "Video tayyorlash hozircha ishlamayapti — klip saqlanib turadi",
};

export function JobItem({ job, online, onRetried }: { job: JobRow; online?: Record<string, number>; onRetried?: (j: JobRow) => void }) {
  const cap = NEEDS[job.type] ?? (job.type === "zip_clips" ? "zip" : job.type === "parse_demo" ? "parse" : "sync");
  const t = useT();
  const waitingForWorker = job.status === "queued" && online && !online[cap];
  const retry = async () => {
    try {
      const r = await api<{ job: JobRow }>(`/api/jobs/${job.id}/retry`, { method: "POST" });
      toast.success(t("Qayta navbatga qo'yildi"));
      onRetried?.(r.job);
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <div className="rounded-2xl border border-line bg-surface-2/70 px-3.5 py-3">
      <div className="flex items-center gap-2.5 text-sm">
        {job.status === "running" && <Loader2 className="size-4 animate-spin text-neon" />}
        {job.status === "queued" && <Clock className="size-4 text-muted" />}
        {job.status === "succeeded" && <CheckCircle2 className="size-4 text-neon" />}
        {job.status === "failed" && <CircleAlert className="size-4 text-danger" />}
        <span className="font-medium">{t(JOB_LABELS_UZ[job.type])}</span>
        <span className={cn("ml-auto font-mono text-xs", job.status === "failed" ? "text-danger" : "text-muted")}>
          {job.status === "running" ? `${job.progress}%` : job.status === "queued" ? t("navbatda") : job.status === "succeeded" ? t("tayyor") : t("xato")}
        </span>
      </div>
      {(job.status === "running" || job.status === "queued") && <Progress value={job.status === "queued" ? 2 : job.progress} className="mt-2.5" />}
      {job.progress_message && job.status === "running" && <div className="mt-1.5 text-xs text-muted">{t(job.progress_message)}</div>}
      {waitingForWorker && <div className={cn("mt-1.5 text-xs", cap === "render" ? "text-warn" : "text-muted")}>{t(NEEDS_TEXT[cap] ?? "Tez orada boshlanadi")}</div>}
      {job.status === "failed" && (
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-xs leading-relaxed text-danger/90">{t(job.error ?? "")}</p>
          {job.type !== "render_clip" && (
            <Button size="sm" variant="ghost" onClick={retry}>
              <RotateCcw /> {t("Qayta")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
