"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FileArchive, FileDown, Pencil, Play, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ClipThumb } from "@/components/clip-thumb";
import { JobItem } from "@/components/job-list";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/primitives";
import { api, toastError } from "@/lib/client/api";
import { useJobs } from "@/lib/client/use-jobs";
import type { ClipRow, JobRow } from "@/lib/types";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { useI18n } from "@/components/i18n";
import { askConfirm } from "@/components/ui/confirm";

function downloadFile(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

type Clip = ClipRow & { matches?: { map_name: string | null } | null };

export function ClipGallery({ clips, online, renderOnline }: { clips: Clip[]; online?: Record<string, number>; renderOnline: boolean }) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const toTelegram = async (c: Clip) => {
    setBusy(`tg:${c.id}`);
    try {
      await api(`/api/clips/${c.id}/telegram`, { method: "POST" });
      toast.success(t("Klip Telegram'ga yuborildi"));
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(null);
    }
  };
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Clip | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { jobs: zipJobs, track } = useJobs([], {
    onDone: (j) => {
      if (j.status === "succeeded") {
        toast.success(t("ZIP tayyor"), { action: { label: t("Yuklab olish"), onClick: () => downloadFile(`/api/exports/${j.id}`) } });
        downloadFile(`/api/exports/${j.id}`);
      } else toast.error(t(j.error ?? "ZIP yaratilmadi"));
    },
  });

  // Render davom etayotgan bo'lsa — holatni yangilab turish
  const pending = clips.some((c) => c.status === "queued" || c.status === "rendering");
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [pending, router]);

  const ready = useMemo(() => clips.filter((c) => c.status === "ready"), [clips]);
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const rename = async (id: string) => {
    try {
      await api(`/api/clips/${id}`, { method: "PATCH", json: { title } });
      setEditing(null);
      toast.success(t("Nom saqlandi"));
      router.refresh();
    } catch (e) {
      toastError(e);
    }
  };
  const remove = async (c: Clip) => {
    if (!(await askConfirm(t("\"{title}\" o'chirilsinmi? MP4 fayl ham o'chadi.", { title: c.title }), { ok: t("O'chirish") }))) return;
    setBusy(c.id);
    try {
      await api(`/api/clips/${c.id}`, { method: "DELETE" });
      toast.success(t("Clip o'chirildi"));
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(null);
    }
  };
  const retry = async (c: Clip) => {
    setBusy(c.id);
    try {
      await api(`/api/clips/${c.id}/retry`, { method: "POST" });
      toast.success(t("Video qayta tayyorlanadi"));
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(null);
    }
  };
  const zip = async () => {
    try {
      const r = await api<{ job: JobRow; included: number }>("/api/clips/zip", { method: "POST", json: { clipIds: [...selected] } });
      track(r.job);
      toast.success(t("{n} ta clip ZIP qilinmoqda", { n: r.included }));
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <div className="space-y-4">
      {!renderOnline && clips.some((c) => c.status === "queued") && (
        <div className="rounded-2xl border border-warn/25 bg-warn/[0.06] px-4 py-3 text-sm text-muted">
          <span className="font-medium text-warn">{t("Video tayyorlash hozircha ishlamayapti.")}</span>{" "}
          {t("Kliplaringiz saqlanadi va video tayyorlash yoqilishi bilan avtomatik MP4 bo'ladi.")}
        </div>
      )}

      {ready.length > 0 && (
        <div data-tour="clips-zip" className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelected(selected.size === ready.length ? new Set() : new Set(ready.map((c) => c.id)))}>
            <Check /> {selected.size === ready.length ? t("Tanlovni bekor qilish") : t("Tayyorlarini tanlash")}
          </Button>
          <Button variant="violet" size="sm" disabled={!selected.size} onClick={zip}>
            <FileArchive /> {t("ZIP yuklab olish")} ({selected.size})
          </Button>
        </div>
      )}
      {zipJobs.filter((j) => j.status !== "succeeded").map((j) => (
        <JobItem key={j.id} job={j} online={online} />
      ))}

      <div data-tour="clips-list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clips.map((c) => (
          <div key={c.id} className={cn("group panel overflow-hidden transition", selected.has(c.id) && "neon-ring")}>
            <div data-tour="clip-thumb" className="relative cursor-pointer" onClick={() => c.status === "ready" && setPreview(c)}>
              <ClipThumb clip={c} lang={lang} />
              {c.status === "ready" && (
                <label className="absolute left-2 top-2 grid size-7 cursor-pointer place-items-center rounded-lg bg-surface/80 backdrop-blur" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} aria-label={t("Tanlash")} />
                </label>
              )}
            </div>
            <div className="space-y-3 p-3.5">
              {editing === c.id ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void rename(c.id);
                  }}
                >
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus className="h-9" />
                  <Button size="sm" variant="primary" type="submit" className="h-9">
                    {t("Saqlash")}
                  </Button>
                </form>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium leading-snug">{c.title}</div>
                    <div className="mt-1 text-xs text-muted">
                      {formatDate(c.created_at, true, lang)} · {c.resolution} · {c.fps} fps {c.size_bytes ? `· ${formatBytes(c.size_bytes)}` : ""}
                    </div>
                  </div>
                  <button
                    data-tour="clip-rename"
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-subtle hover:bg-fg/5 hover:text-fg"
                    aria-label={t("Nomini o'zgartirish")}
                    onClick={() => {
                      setEditing(c.id);
                      setTitle(c.title);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}
              {c.status === "failed" && c.error && <p className="line-clamp-3 text-xs text-danger/90">{t(c.error)}</p>}
              <div data-tour="clip-buttons" className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" disabled={c.status !== "ready"} onClick={() => setPreview(c)}>
                  <Play /> {t("Ko'rish")}
                </Button>
                {c.status === "ready" ? (
                  <Button size="sm" variant="primary" asChild>
                    <a href={`/api/clips/${c.id}/download`}>
                      <Download /> {t("MP4 yuklab olish")}
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="primary" disabled title={t("Render tugagach faollashadi")}>
                    <Download /> {t("MP4 yuklab olish")}
                  </Button>
                )}
                {c.status === "ready" && (
                  <Button size="sm" variant="secondary" onClick={() => toTelegram(c)} loading={busy === `tg:${c.id}`}>
                    <Send /> Telegram
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <a href={`/api/demos/${c.demo_file_id}/download`}>
                    <FileDown /> {t("Demoni yuklab olish")}
                  </a>
                </Button>
                {c.status === "failed" && (
                  <Button size="sm" variant="outline" onClick={() => retry(c)} loading={busy === c.id}>
                    <RotateCcw /> {t("Qayta render")}
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="ml-auto text-subtle hover:text-danger" onClick={() => remove(c)} loading={busy === c.id} aria-label={t("O'chirish")}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)} title={preview?.title ?? ""} closeLabel={t("Yopish")}>
        {preview && (
          <div className="space-y-3">
            <video src={`/api/clips/${preview.id}/download?inline=1`} controls autoPlay playsInline className="aspect-video w-full rounded-xl bg-black" />
            <div className="flex justify-end gap-2">
              <Button variant="primary" size="sm" asChild>
                <a href={`/api/clips/${preview.id}/download`}>
                  <Download /> {t("MP4 yuklab olish")}
                </a>
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
