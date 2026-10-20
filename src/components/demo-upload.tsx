"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Upload } from "tus-js-client";
import { checkDemoName } from "@shared/demo-file";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/primitives";
import { JobItem } from "@/components/job-list";
import { api, toastError } from "@/lib/client/api";
import { useJobs } from "@/lib/client/use-jobs";
import type { JobRow } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

interface UploadInit {
  demoId: string;
  bucket: string;
  objectName: string;
  endpoint: string;
  anonKey: string;
  token: string;
}

type Phase = { kind: "idle" } | { kind: "uploading"; name: string; pct: number; size: number } | { kind: "verifying"; name: string };

export function DemoUpload({ matchId, maxMb, compact, online }: { matchId?: string; maxMb: number; compact?: boolean; online?: Record<string, number> }) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<Upload | null>(null);
  const router = useRouter();
  const { jobs, track } = useJobs([], {
    onDone: (j) => {
      if (j.status === "succeeded") {
        toast.success("Demo tahlil qilindi", {
          action: j.result?.matchId ? { label: "Ochish", onClick: () => router.push(`/matches/${j.result!.matchId}`) } : undefined,
        });
      } else toast.error(j.error ?? "Demo tahlilida xato");
    },
  });

  async function start(file: File) {
    const check = checkDemoName(file.name, file.size, maxMb * 1024 * 1024);
    if (!check.ok) return toast.error(check.error);
    try {
      setPhase({ kind: "uploading", name: file.name, pct: 0, size: file.size });
      const init = await api<UploadInit>("/api/demos/upload", { method: "POST", json: { name: file.name, size: file.size, matchId } });
      await new Promise<void>((resolve, reject) => {
        const up = new Upload(file, {
          endpoint: init.endpoint,
          retryDelays: [0, 2000, 5000, 10000, 20000],
          headers: { authorization: `Bearer ${init.token}`, apikey: init.anonKey, "x-upsert": "false" },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          chunkSize: 6 * 1024 * 1024, // Supabase talabi: 6 MB
          metadata: { bucketName: init.bucket, objectName: init.objectName, contentType: check.compression === "bz2" ? "application/x-bzip2" : "application/octet-stream", cacheControl: "3600" },
          onError: (e) => reject(new Error(`Yuklashda xato: ${e.message.split("\n")[0]}`)),
          onProgress: (sent, total) => setPhase({ kind: "uploading", name: file.name, pct: (sent / total) * 100, size: file.size }),
          onSuccess: () => resolve(),
        });
        uploadRef.current = up;
        up.findPreviousUploads().then((prev) => {
          if (prev.length) up.resumeFromPreviousUpload(prev[0]);
          up.start();
        });
      });
      setPhase({ kind: "verifying", name: file.name });
      const done = await api<{ job: JobRow }>(`/api/demos/${init.demoId}/complete`, { method: "POST" });
      track(done.job);
      toast.success("Demo yuklandi — tahlil navbatga qo'yildi");
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      uploadRef.current = null;
      setPhase({ kind: "idle" });
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = phase.kind !== "idle";
  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files[0];
          if (f && !busy) void start(f);
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed transition-all duration-300",
          compact ? "p-5" : "p-8 sm:p-10",
          drag ? "border-neon/70 bg-neon/[0.06]" : "border-line-strong bg-surface-2/40 hover:border-white/25",
        )}
      >
        {phase.kind === "idle" ? (
          <div className={cn("flex items-center gap-5", compact ? "flex-row" : "flex-col text-center")}>
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-neon/25 bg-neon/10 text-neon">
              <UploadCloud className="size-6" />
            </div>
            <div className={cn(compact ? "flex-1" : "")}>
              <div className="font-display text-xl font-semibold uppercase tracking-wide">Demo faylni shu yerga tashlang</div>
              <p className="mt-1 text-sm text-muted">
                <span className="font-mono text-fg/80">.dem</span> yoki <span className="font-mono text-fg/80">.dem.bz2</span> · maksimal {maxMb >= 1024 ? `${(maxMb / 1024).toFixed(1)} GB` : `${maxMb} MB`} · uzilib qolsa davom ettiriladi
              </p>
            </div>
            <Button variant="primary" onClick={() => inputRef.current?.click()}>
              <FileUp /> Fayl tanlash
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{phase.name}</div>
                <div className="text-xs text-muted">
                  {phase.kind === "uploading" ? `${formatBytes((phase.size * phase.pct) / 100)} / ${formatBytes(phase.size)}` : "Fayl tekshirilmoqda (CS2 demo signaturasi)…"}
                </div>
              </div>
              {phase.kind === "uploading" && (
                <>
                  <span className="font-mono text-sm text-neon">{phase.pct.toFixed(0)}%</span>
                  <Button size="icon" variant="ghost" aria-label="Bekor qilish" onClick={() => void uploadRef.current?.abort(true).then(() => setPhase({ kind: "idle" }))}>
                    <X />
                  </Button>
                </>
              )}
            </div>
            <Progress value={phase.kind === "uploading" ? phase.pct : 100} />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".dem,.bz2"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void start(f);
          }}
        />
      </div>
      {jobs.map((j) => (
        <JobItem key={j.id} job={j} online={online} />
      ))}
    </div>
  );
}
