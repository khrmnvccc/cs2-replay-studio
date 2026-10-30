"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Bell,
  CheckCircle2,
  CircleAlert,
  Clock,
  Download,
  ExternalLink,
  Film,
  MessageSquareOff,
  Play,
  Plus,
  Save,
  Send,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { render, type NotificationTemplate, type TemplateButton } from "@shared/notify";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/switch";
import { api, toastError } from "@/lib/client/api";
import { cn, formatDate } from "@/lib/utils";
import { askConfirm } from "@/components/ui/confirm";

type Sent = { id: string; title: string; key: string | null; who: string; telegram: string | null; at: string };
type Lang = "uz" | "ru";

const ICONS: Record<string, typeof Bell> = { play: Play, clock: Clock, download: Download, check: CheckCircle2, alert: CircleAlert, archive: Archive, send: Send, bell: Bell };
const CATEGORIES: [string, string][] = [
  ["matches", "O'yinlar"],
  ["clips", "Kliplar"],
  ["account", "Hisob"],
];
const SAMPLE = { map: "Mirage", score: "13 : 1", kills: 21, title: "Mirage · AK-47 ace", n: 5, error: "Demo fayl buzilgan", matchId: "…" };

function Seg<T extends string>({ value, options, onChange, className }: { value: T; options: [T, string][]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("grid gap-1 rounded-xl bg-fg/[0.05] p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={cn("h-9 rounded-lg px-3 text-sm font-semibold transition", value === v ? "bg-neon text-on-neon shadow-sm" : "text-muted hover:text-fg")}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function AdminNotifications({ templates, bot, linkedCount, sent, sentCount }: { templates: NotificationTemplate[]; bot: { username: string } | null; linkedCount: number; sent: Sent[]; sentCount: number }) {
  const t = useT();
  const router = useRouter();
  const [top, setTop] = useState<"notifications" | "bot">(bot ? "notifications" : "bot");
  const [view, setView] = useState<"templates" | "sent">("templates");
  const [list, setList] = useState(templates);
  const [selKey, setSelKey] = useState(templates[0]?.key ?? "");
  const [draft, setDraft] = useState<NotificationTemplate | null>(templates[0] ?? null);
  const [lang, setLang] = useState<Lang>("uz");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);

  const enabled = list.filter((x) => x.enabled || x.required).length;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(list.find((x) => x.key === draft?.key)), [draft, list]);

  const select = async (tpl: NotificationTemplate) => {
    if (dirty && !(await askConfirm(t("Saqlanmagan o'zgarishlar bor. Baribir boshqasiga o'tasizmi?"), { ok: t("O'tish"), danger: false }))) return;
    setSelKey(tpl.key);
    setDraft(tpl);
    setTimeout(() => document.getElementById("tpl-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const payload = (x: NotificationTemplate) => ({
    enabled: x.enabled,
    title_uz: x.title_uz,
    title_ru: x.title_ru,
    body_uz: x.body_uz,
    body_ru: x.body_ru,
    buttons: x.buttons,
    with_media: x.with_media,
    telegram: x.telegram,
    sound: x.sound,
  });

  const persist = async (x: NotificationTemplate) => {
    await api(`/api/admin/notifications/${x.key}`, { method: "PUT", json: payload(x) });
    setList((l) => l.map((y) => (y.key === x.key ? x : y)));
  };

  const toggleQuick = async (x: NotificationTemplate, v: boolean) => {
    const next = { ...x, enabled: v };
    try {
      await persist(next);
      if (draft?.key === x.key) setDraft((d) => (d ? { ...d, enabled: v } : d));
    } catch (e) {
      toastError(e);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await persist(draft);
      toast.success(t("Saqlandi"));
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (!draft) return;
    setTesting(true);
    try {
      if (dirty) await persist(draft);
      await api(`/api/admin/notifications/${draft.key}/test`, { method: "POST" });
      toast.success(t("Sinov xabari yuborildi — qo'ng'iroqchani va Telegram'ni tekshiring"));
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setTesting(false);
    }
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const r = await api<{ username: string }>("/api/admin/telegram", { method: "POST", json: { token } });
      toast.success(t("Bot ulandi: @{u}", { u: r.username }));
      setToken("");
      router.refresh();
    } catch (e) {
      toastError(e);
    } finally {
      setConnecting(false);
    }
  };

  const set = <K extends keyof NotificationTemplate>(k: K, v: NotificationTemplate[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const setBtn = (i: number, patch: Partial<TemplateButton>) => set("buttons", draft!.buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const titleKey = lang === "uz" ? "title_uz" : "title_ru";
  const bodyKey = lang === "uz" ? "body_uz" : "body_ru";
  const previewTitle = draft ? render(draft[titleKey] || draft.title_uz, SAMPLE) : "";
  const previewBody = draft ? render(draft[bodyKey] || draft.body_uz, SAMPLE) : "";

  return (
    <div className="space-y-6">
      <div data-tour="admin-tabs" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto border-b border-line px-4 pb-3">
        {(
          [
            ["notifications", "Bildirishnomalar", Bell],
            ["bot", "Telegram bot", Send],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTop(id)}
            className={cn("flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition", top === id ? "bg-neon/10 text-fg" : "text-muted hover:text-fg")}
          >
            <Icon className={cn("size-5", top === id && "text-neon")} />
            {t(label)}
          </button>
        ))}
      </div>

      {top === "bot" ? (
        <div className="space-y-4">
          <div className="panel flex items-center gap-4 p-4">
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-white", bot ? "bg-sky-500" : "bg-fg/20")}>
              <Send className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{bot ? `@${bot.username}` : t("Bot ulanmagan")}</div>
              <div className="text-sm text-muted">{bot ? t("{n} ta foydalanuvchi Telegram'ni ulagan", { n: linkedCount }) : t("Token kiritilgach, bot darhol ishlay boshlaydi")}</div>
            </div>
            {bot && (
              <a href={`https://t.me/${bot.username}`} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-xl text-muted hover:text-fg" aria-label="Telegram">
                <ExternalLink className="size-5" />
              </a>
            )}
          </div>
          <div className="panel space-y-3 p-4">
            <div className="font-semibold">{bot ? t("Tokenni almashtirish") : t("Botni ulash")}</div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
              <li>{t("Telegram'da @BotFather ni oching va /newbot yozing.")}</li>
              <li>{t("Bot nomi va username'ini kiriting (username bot bilan tugashi kerak).")}</li>
              <li>{t("BotFather bergan tokenni shu yerga qo'ying va «Ulash»ni bosing.")}</li>
            </ol>
            <Input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:AA…" className="font-mono" />
            <Button variant="primary" className="w-full" onClick={connect} loading={connecting} disabled={!token.trim()}>
              <Send /> {t("Ulash")}
            </Button>
            <p className="text-xs text-subtle">{t("Token faqat bazada saqlanadi va hech kimga ko'rsatilmaydi.")}</p>
          </div>
        </div>
      ) : (
        <>
          <div data-tour="admin-count" className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-muted">{t("{a}/{b} yoqilgan", { a: enabled, b: list.length })}</span>
            {!bot && <span className="rounded-full bg-warn/10 px-3 py-1 text-sm text-warn">{t("Telegram bot ulanmagan — faqat ilovada ko'rinadi")}</span>}
          </div>
          <Seg
            value={view}
            onChange={setView}
            options={[
              ["templates", t("Shablonlar")],
              ["sent", `${t("Yuborilgan")} · ${sentCount}`],
            ]}
          />

          {view === "sent" ? (
            <div className="panel divide-y divide-line overflow-hidden">
              {sent.length ? (
                sent.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{n.title}</div>
                      <div className="text-xs text-muted">
                        {n.who} · {formatDate(n.at, true)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        n.telegram === "sent" ? "bg-sky-500/10 text-sky-500" : n.telegram === "failed" ? "bg-danger/10 text-danger" : "bg-fg/[0.06] text-subtle",
                      )}
                    >
                      {n.telegram === "sent" ? "Telegram ✓" : n.telegram === "failed" ? t("Telegram xato") : t("Faqat ilova")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-muted">{t("Hali hech narsa yuborilmagan")}</p>
              )}
            </div>
          ) : (
            <>
              <div data-tour="admin-templates" className="space-y-6">
              {CATEGORIES.map(([cat, label], ci) => {
                const items = list.filter((x) => x.category === cat);
                if (!items.length) return null;
                return (
                  <section key={cat} className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 place-items-center rounded-lg bg-neon text-xs font-bold text-on-neon">{String.fromCharCode(65 + ci)}</span>
                      <span className="label !text-[12px] !text-muted">{t(label)}</span>
                    </div>
                    {items.map((x) => {
                      const Icon = ICONS[x.icon] ?? Bell;
                      return (
                        <div
                          key={x.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => select(x)}
                          onKeyDown={(e) => e.key === "Enter" && select(x)}
                          className={cn("panel flex cursor-pointer items-center gap-4 p-4 transition", selKey === x.key && "!border-neon/40 bg-neon/[0.06]")}
                        >
                          <Icon className="size-6 shrink-0 text-muted" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-semibold">{x.title_uz}</div>
                            <div className="mt-1 flex gap-2 text-subtle [&_svg]:size-4">
                              {x.buttons.some((b) => b.kind === "app") && <ExternalLink />}
                              {x.with_media && <Film />}
                              {x.telegram && <Send />}
                              {x.sound && <Volume2 />}
                            </div>
                          </div>
                          <Switch checked={x.enabled || x.required} disabled={x.required} onChange={(v) => toggleQuick(x, v)} label={x.title_uz} />
                        </div>
                      );
                    })}
                  </section>
                );
              })}
              </div>

              {draft && (
                <section id="tpl-editor" data-tour="admin-editor" className="scroll-mt-24 space-y-5 border-t border-line pt-6">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight">{draft.title_uz}</h2>
                    <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted">
                      <Zap className="size-4" /> {lang === "ru" ? draft.trigger_ru || draft.trigger_uz : draft.trigger_uz}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted">
                    {draft.required ? t("Majburiy · yoqilgan") : draft.enabled ? t("Yoqilgan") : t("O'chirilgan")}
                    <Switch checked={draft.enabled || draft.required} disabled={draft.required} onChange={(v) => set("enabled", v)} />
                  </div>

                  <div data-tour="admin-text" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="label !text-[12px]">{t("Matn")}</span>
                      <Seg value={lang} onChange={setLang} options={[["uz", "UZ"], ["ru", "RU"]]} className="w-32" />
                    </div>
                    <Input value={draft[titleKey]} onChange={(e) => set(titleKey, e.target.value)} placeholder={t("Sarlavha")} maxLength={120} />
                    <textarea
                      value={draft[bodyKey]}
                      onChange={(e) => set(bodyKey, e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder={t("Matn")}
                      className="w-full resize-y rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-base text-fg placeholder:text-subtle focus:border-ct/60 focus:outline-none focus:ring-4 focus:ring-ct/15 sm:text-sm"
                    />
                    {draft.vars.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
                        {t("O'zgaruvchi qo'shish:")}
                        {draft.vars.map((v) => (
                          <button key={v} type="button" onClick={() => set(bodyKey, `${draft[bodyKey]}${draft[bodyKey] ? " " : ""}{${v}}`)} className="rounded-lg border border-neon/25 bg-neon/10 px-2 py-0.5 font-mono text-neon">
                            {`{${v}}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="panel divide-y divide-line">
                    <label className="flex items-center gap-3 p-4">
                      <Film className="size-5 text-tside" />
                      <span className="flex-1 font-medium">{t("Video bilan yuborish")}</span>
                      <Switch checked={draft.with_media} onChange={(v) => set("with_media", v)} />
                    </label>
                    <label className="flex items-center gap-3 p-4">
                      <Send className="size-5 text-sky-500" />
                      <span className="flex-1 font-medium">{t("Telegramga ham yuborish")}</span>
                      <Switch checked={draft.telegram} onChange={(v) => set("telegram", v)} />
                    </label>
                    <label className="flex items-center gap-3 p-4">
                      <Volume2 className="size-5 text-tside" />
                      <span className="flex-1 font-medium">{t("Ovoz bilan")}</span>
                      <Switch checked={draft.sound} onChange={(v) => set("sound", v)} />
                    </label>
                  </div>

                  <div data-tour="admin-buttons" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="label !text-[12px]">{t("Tugmalar")}</span>
                      <span className="text-sm text-subtle">{draft.buttons.length} / 3</span>
                    </div>
                    {draft.buttons.map((b, i) => (
                      <div key={i} className="panel space-y-3 p-4">
                        <div className="flex gap-2">
                          <Input
                            value={lang === "uz" ? b.label_uz : b.label_ru}
                            onChange={(e) => setBtn(i, lang === "uz" ? { label_uz: e.target.value } : { label_ru: e.target.value })}
                            placeholder={t("Tugma matni")}
                            maxLength={40}
                          />
                          <button type="button" onClick={() => set("buttons", draft.buttons.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger" aria-label={t("O'chirish")}>
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                        <Seg
                          value={b.kind}
                          onChange={(kind) => setBtn(i, { kind })}
                          options={[
                            ["app", t("Ilovaga")],
                            ["none", t("Yo'q")],
                          ]}
                        />
                        {b.kind === "app" && (
                          <label className="block text-xs text-subtle">
                            {t("Ilova ichidagi manzil")}
                            <Input value={b.path} onChange={(e) => setBtn(i, { path: e.target.value })} placeholder="/matches/{matchId}" className="mt-1 font-mono" />
                          </label>
                        )}
                      </div>
                    ))}
                    {draft.buttons.length < 3 && (
                      <button
                        type="button"
                        onClick={() => set("buttons", [...draft.buttons, { label_uz: "", label_ru: "", kind: "app", path: "/matches" }])}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-sm font-semibold text-muted transition hover:text-fg"
                      >
                        <Plus className="size-4" /> {t("Tugma qo'shish")}
                      </button>
                    )}
                  </div>

                  <div data-tour="admin-preview" className="space-y-3">
                    <span className="label !text-[12px]">{t("Telegram ko'rinishi")}</span>
                    <div className="rounded-3xl bg-sky-100 p-4 dark:bg-sky-950/40">
                      {draft.telegram ? (
                        <div className="ml-auto max-w-sm space-y-1.5">
                          <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100">
                            {draft.with_media && (
                              <div className="grid aspect-video place-items-center bg-slate-900 text-white/70">
                                <Play className="size-10" />
                              </div>
                            )}
                            <div className="px-4 py-3">
                              <div className="font-semibold">{previewTitle || "—"}</div>
                              {previewBody && <div className="mt-1.5 whitespace-pre-line text-[15px]">{previewBody}</div>}
                              <div className="mt-1 text-right text-xs text-slate-400">9:41</div>
                            </div>
                          </div>
                          {draft.buttons
                            .filter((b) => b.kind === "app")
                            .map((b, i) => (
                              <div key={i} className="flex items-center justify-center gap-2 rounded-xl bg-white/80 py-2.5 text-sm font-semibold text-sky-600 dark:bg-slate-800/80 dark:text-sky-400">
                                <ExternalLink className="size-4" /> {(lang === "uz" ? b.label_uz : b.label_ru || b.label_uz) || "…"}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                          <MessageSquareOff className="size-5" /> {t("Telegramga yuborilmaydi")}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="primary" size="lg" className="w-full" onClick={save} loading={saving} disabled={!dirty}>
                    <Save /> {t("Saqlash")}
                  </Button>
                  <p className="text-center text-xs text-subtle">{t("Saqlaganda xabar yuborilmaydi.")}</p>
                  <Button data-tour="admin-test" variant="secondary" className="w-full" onClick={test} loading={testing}>
                    <Bell /> {t("Menga sinov yuborish")}
                  </Button>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
