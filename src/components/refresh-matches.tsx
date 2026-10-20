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

export function RefreshMatchesButton({ enabled, initialJobs = [], online, showJobs = true }: { enabled: boolean; initialJobs?: JobRow[]; online?: Record<string, number>; showJobs?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { jobs, active, track } = useJobs(initialJobs.filter((j) => j.type === "sync_matches"), {
    onDone: (j) => (j.status === "succeeded" ? toast.success(`Yangilandi: ${Number(j.result?.newMatches ?? 0)} ta yangi match`) : toast.error(j.error ?? "Yangilashda xato")),
  });
  if (!enabled) {
    return (
      <Button asChild variant="secondary">
        <Link href="/settings#history">
          <RefreshCw /> Match tarixini ulash
        </Link>
      </Button>
    );
  }
  const run = async () => {
    setLoading(true);
    try {
      const r = await api<{ job: JobRow; deduped?: boolean }>("/api/matches/refresh", { method: "POST" });
      track(r.job);
      toast.success(r.deduped ? "Yangilash allaqachon davom etmoqda" : "Valve'dan yangi matchlar so'ralmoqda");
    } catch (e) {
      toastError(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="secondary" onClick={run} loading={loading} disabled={active.length > 0}>
        {!loading && <RefreshCw className={active.length ? "animate-spin" : ""} />} Refresh matches
      </Button>
      {showJobs && jobs.slice(0, 1).map((j) => (
        <div key={j.id} className="w-72">
          <JobItem job={j} online={online} />
        </div>
      ))}
    </div>
  );
}
