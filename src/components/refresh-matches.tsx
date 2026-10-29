"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { JobItem } from "@/components/job-list";
import { api, toastError } from "@/lib/client/api";
import { useJobs } from "@/lib/client/use-jobs";
import type { JobRow } from "@/lib/types";
import { useState } from "react";
import { useT } from "@/components/i18n";

export function RefreshMatchesButton({ enabled, initialJobs = [], online, showJobs = true, label, className }: { enabled: boolean; initialJobs?: JobRow[]; online?: Record<string, number>; showJobs?: boolean; label?: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const t = useT();
  const { jobs, active, track } = useJobs(initialJobs.filter((j) => j.type === "sync_matches"), {
    onDone: (j) => (j.status === "succeeded" ? toast.success(t("Yangilandi: {n} ta yangi match", { n: Number(j.result?.newMatches ?? 0) })) : toast.error(t(j.error ?? "Yangilashda xato"))),
  });
  if (!enabled) {
    return (
      <Button asChild variant="secondary" className={className}>
        <Link href="/settings#history">
          <RefreshCw /> {t(label ? "Ulash" : "Match tarixini ulash")}
        </Link>
      </Button>
    );
  }
  const run = async () => {
    setLoading(true);
    try {
      const r = await api<{ job: JobRow; deduped?: boolean }>("/api/matches/refresh", { method: "POST" });
      track(r.job);
      toast.success(r.deduped ? t("Yangilash allaqachon davom etmoqda") : t("Valve'dan yangi matchlar so'ralmoqda"));
    } catch (e) {
      toastError(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button variant="secondary" onClick={run} loading={loading} disabled={active.length > 0} className={className}>
        {!loading && <RefreshCw className={active.length ? "animate-spin" : ""} />} {t(label ?? "Matchlarni yangilash")}
      </Button>
      {showJobs && jobs.slice(0, 1).map((j) => (
        <div key={j.id} className="w-full sm:w-72">
          <JobItem job={j} online={online} />
        </div>
      ))}
    </div>
  );
}
