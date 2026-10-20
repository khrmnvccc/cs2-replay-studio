"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JobRow } from "@/lib/types";

/** Ishlarni (processing_jobs) kuzatadi; tugaganda sahifani yangilaydi. */
export function useJobs(initial: JobRow[], opts: { onDone?: (job: JobRow) => void } = {}) {
  const [jobs, setJobs] = useState<JobRow[]>(initial);
  const router = useRouter();
  const doneRef = useRef(new Set<string>());
  const onDone = useRef(opts.onDone);
  useEffect(() => {
    onDone.current = opts.onDone;
  });

  const track = (job: JobRow) => setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
  const active = jobs.filter((j) => j.status === "queued" || j.status === "running");
  const key = active.map((j) => j.id).join(",");

  useEffect(() => {
    if (!key) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs?ids=${key}`);
        if (!res.ok) return;
        const { jobs: fresh } = (await res.json()) as { jobs: JobRow[] };
        if (stop) return;
        setJobs((prev) => prev.map((j) => fresh.find((f) => f.id === j.id) ?? j));
        let changed = false;
        for (const f of fresh) {
          if ((f.status === "succeeded" || f.status === "failed") && !doneRef.current.has(f.id)) {
            doneRef.current.add(f.id);
            changed = true;
            onDone.current?.(f);
          }
        }
        if (changed) router.refresh();
      } catch {
        /* keyingi tickda qayta */
      }
    };
    const t = setInterval(tick, 2500);
    void tick();
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [key, router]);

  return { jobs, active, track };
}
