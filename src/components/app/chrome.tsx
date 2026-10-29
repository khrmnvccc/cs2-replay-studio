"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Archive,
  Bell,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock,
  Download,
  Play,
  LayoutGrid,
  LogOut,
  Map as MapIcon,
  MapPin,
  Medal,
  Menu,
  Moon,
  PlaySquare,
  Send,
  Server,
  Settings,
  Trophy,
  Users,
  Wand2,
} from "lucide-react";
import { ListGroup, Sheet } from "@/components/ui/sheet";
import { LangSwitch } from "@/components/prefs";
import { useT } from "@/components/i18n";
import { TourProvider, useTour } from "@/components/tour";
import { api, toastError } from "@/lib/client/api";
import { cn } from "@/lib/utils";

export type ChromeUser = { name: string; avatarUrl: string | null; historyEnabled: boolean; owner: boolean; unread: number; telegram: "linked" | "unlinked" | "unavailable" };

type Ctx = { user: ChromeUser; unread: number; openMenu: () => void; openBell: () => void };
const ChromeCtx = createContext<Ctx | null>(null);
const useChrome = () => {
  const c = useContext(ChromeCtx);
  if (!c) throw new Error("AppChrome ichida ishlating");
  return c;
};

const TABS = [
  { href: "/matches", label: "Matchlar", icon: LayoutGrid, tour: "nav-matches" },
  { href: "/clips", label: "Kliplar", icon: PlaySquare, tour: "nav-clips" },
  { href: "#menu", label: "Menyu", icon: Menu, tour: "nav-menu" },
  { href: "/stats", label: "Statistika", icon: BarChart3, tour: "nav-stats" },
] as const;

const TITLES: [string, string, typeof LayoutGrid][] = [
  ["/matches", "Matchlar", LayoutGrid],
  ["/clips", "Kliplar", PlaySquare],
  ["/stats", "Statistika", BarChart3],
  ["/records", "Rekordlar", Trophy],
  ["/settings", "Sozlamalar", Settings],
  ["/system", "Tizim holati", Server],
  ["/admin/notifications", "Bildirishnomalar", BellRing],
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Ilova "qobig'i": menyu va bildirishnoma oynalari bitta joyda, istalgan tugmadan ochiladi. */
export function AppChrome({ user, children }: { user: ChromeUser; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const [unread, setUnread] = useState(user.unread);
  return (
    <ChromeCtx.Provider value={{ user, unread, openMenu: () => setMenu(true), openBell: () => setBell(true) }}>
      <TourProvider>{children}</TourProvider>
      <MenuSheet open={menu} onOpenChange={setMenu} user={user} />
      <BellSheet open={bell} onOpenChange={setBell} onRead={() => setUnread(0)} />
    </ChromeCtx.Provider>
  );
}

export function PageTitle() {
  const path = usePathname();
  const t = useT();
  const hit = TITLES.find(([p]) => isActive(path, p));
  if (!hit) return null;
  const [, title, Icon] = hit;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Icon className="size-6 shrink-0 text-neon" />
      <h1 className="truncate text-2xl font-bold tracking-tight">{t(title)}</h1>
    </div>
  );
}

export function HeaderActions() {
  const { user, unread, openMenu, openBell } = useChrome();
  const tour = useTour();
  const t = useT();
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface p-1 shadow-[0_6px_18px_-12px_rgb(16_42_67/0.35)]">
      {tour.available && (
        <button data-tour="help" onClick={tour.start} className="grid size-10 place-items-center rounded-full text-muted transition hover:text-fg" aria-label={t("Darslik")} title={t("Darslik")}>
          <CircleHelp className="size-5" />
        </button>
      )}
      <button data-tour="bell" onClick={openBell} className="relative grid size-10 place-items-center rounded-full text-muted transition hover:text-fg" aria-label={t("Bildirishnomalar")}>
        <Bell className="size-5" />
        {unread > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-danger ring-2 ring-surface" />}
      </button>
      <button onClick={openMenu} className="rounded-full ring-2 ring-transparent transition hover:ring-neon/40" aria-label={t("Profil")}>
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" unoptimized />
        ) : (
          <span className="block size-10 rounded-full bg-surface-3" />
        )}
      </button>
    </div>
  );
}

export function BottomNav() {
  const path = usePathname();
  const t = useT();
  const { openMenu } = useChrome();
  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-4 rounded-[1.75rem] bg-surface p-1.5 shadow-[0_12px_32px_-14px_rgb(16_42_67/0.35)] lg:hidden">
      {TABS.map(({ href, label, icon: Icon, tour }) => {
        const active = href !== "#menu" && isActive(path, href);
        const cls = cn("flex min-w-0 flex-col items-center gap-1 rounded-[1.25rem] py-2 text-[11px] font-bold transition", active ? "bg-neon text-on-neon" : "text-muted");
        const inner = (
          <>
            <Icon className="size-5" />
            <span className="max-w-full truncate px-0.5">{t(label)}</span>
          </>
        );
        return href === "#menu" ? (
          <button key={href} type="button" data-tour={tour} onClick={openMenu} className={cls}>
            {inner}
          </button>
        ) : (
          <Link key={href} href={href} data-tour={tour} className={cls}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav() {
  const path = usePathname();
  const t = useT();
  const { user, openMenu } = useChrome();
  const items = [
    ...TABS.filter((x) => x.href !== "#menu"),
    { href: "/settings", label: "Sozlamalar", icon: Settings, tour: undefined },
    ...(user.owner ? [{ href: "/system", label: "Tizim holati", icon: Server, tour: undefined }] : []),
  ];
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon, tour }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
              active ? "bg-neon text-on-neon shadow-sm" : "text-muted hover:bg-fg/[0.04] hover:text-fg",
            )}
          >
            <Icon className="size-[18px]" />
            {t(label)}
          </Link>
        );
      })}
      <button data-tour="nav-menu" onClick={openMenu} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-muted transition-colors hover:bg-fg/[0.04] hover:text-fg">
        <Menu className="size-[18px]" />
        {t("Menyu")}
      </button>
    </nav>
  );
}

function Row({ icon, label, value, href, soon, onClick, tone }: { icon: ReactNode; label: string; value?: ReactNode; href?: string; soon?: boolean; onClick?: () => void; tone?: "danger" }) {
  const t = useT();
  const body = (
    <>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-fg/[0.06] [&_svg]:size-5", tone === "danger" ? "text-danger" : "text-fg/80")}>{icon}</span>
      <span className={cn("flex-1 text-[15px]", tone === "danger" && "text-danger")}>{t(label)}</span>
      {soon ? (
        <span className="rounded-full bg-fg/[0.06] px-2.5 py-1 text-[11px] font-medium text-subtle">{t("Tez orada")}</span>
      ) : (
        value
      )}
      {!soon && (href || onClick) && tone !== "danger" && <ChevronRight className="size-4 text-subtle" />}
    </>
  );
  const cls = cn("flex w-full items-center gap-3 px-3.5 py-3 text-left", soon ? "cursor-default opacity-75" : "transition hover:bg-fg/[0.03]");
  if (href && !soon)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" className={cls} onClick={soon ? undefined : onClick} aria-disabled={soon}>
      {body}
    </button>
  );
}

function MenuSheet({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: ChromeUser }) {
  const t = useT();
  const close = () => onOpenChange(false);
  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("Profil")} closeLabel={t("Yopish")} actions={<LangSwitch className="w-24" />}>
      <div onClick={(e) => (e.target as HTMLElement).closest("a") && close()}>
        <div className="mb-1 flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3.5">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={48} height={48} className="size-12 rounded-full object-cover" unoptimized />
          ) : (
            <span className="size-12 rounded-full bg-surface-3" />
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{user.name}</div>
            <div className="text-xs text-subtle">Steam</div>
          </div>
        </div>

        <ListGroup>
          <Row
            icon={<SteamGlyph />}
            label="Matchmaking"
            href="/settings#history"
            value={<span className={cn("text-sm", user.historyEnabled ? "text-neon" : "text-subtle")}>{t(user.historyEnabled ? "Ulangan" : "Ulanmagan")}</span>}
          />
          <Row icon={<FaceitGlyph />} label="Faceit" soon />
          <TelegramRow state={user.telegram} />
        </ListGroup>

        <ListGroup label={t("O'yiningiz")}>
          <Row icon={<Wand2 />} label="Skin changer" soon />
          <Row icon={<MapIcon />} label="Xaritalar" soon />
          <Row icon={<MapPin />} label="Xarita joy nomlari" soon />
          <Row icon={<Medal />} label="Turnirlar" soon />
          <Row icon={<Trophy />} label="Rekordlar" href="/records" />
          <Row icon={<Users />} label="Do'stlar" soon />
        </ListGroup>

        <ListGroup label={t("Ilova")}>
          <Row icon={<Settings />} label="Sozlamalar" href="/settings" />
          <Row icon={<Moon />} label="Tungi rejim" onClick={toggleTheme} />
          {user.owner && <Row icon={<BellRing />} label="Bildirishnomalar boshqaruvi" href="/admin/notifications" />}
          {user.owner && <Row icon={<Server />} label="Tizim holati" href="/system" />}
        </ListGroup>

        <form action="/api/auth/logout" method="post" className="mt-4">
          <ListGroup>
            <button className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-danger transition hover:bg-danger/5">
              <span className="grid size-10 place-items-center rounded-xl bg-danger/10">
                <LogOut className="size-5" />
              </span>
              <span className="text-[15px]">{t("Chiqish")}</span>
            </button>
          </ListGroup>
        </form>
      </div>
    </Sheet>
  );
}

type Note = { id: string; template_key: string | null; icon: string; title: Record<string, string>; body: Record<string, string>; link: string | null; read_at: string | null; created_at: string };

const NOTE_ICONS: Record<string, [typeof Bell, string]> = {
  play: [Play, "bg-[#ff5a1f]"],
  clock: [Clock, "bg-amber-500"],
  download: [Download, "bg-neon"],
  check: [CheckCircle2, "bg-emerald-500"],
  alert: [CircleAlert, "bg-danger"],
  archive: [Archive, "bg-violet"],
  send: [Send, "bg-sky-500"],
  bell: [Bell, "bg-slate-500"],
};

function ago(iso: string, t: ReturnType<typeof useT>) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return t("hozir");
  if (m < 60) return t("{n} daq", { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t("{n} soat", { n: h });
  const d = Math.round(h / 24);
  if (d < 14) return t("{n} kun", { n: d });
  return t("{n} hafta", { n: Math.round(d / 7) });
}

function BellSheet({ open, onOpenChange, onRead }: { open: boolean; onOpenChange: (o: boolean) => void; onRead: () => void }) {
  const t = useT();
  const lang = typeof document !== "undefined" && document.documentElement.lang === "ru" ? "ru" : "uz";
  const router = useRouter();
  const [items, setItems] = useState<Note[] | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    api<{ notifications: Note[] }>("/api/notifications")
      .then((r) => alive && setItems(r.notifications))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [open]);
  const unread = items?.filter((n) => !n.read_at).length ?? 0;
  const readAll = async () => {
    try {
      await api("/api/notifications/read", { method: "POST" });
      setItems((xs) => xs?.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) ?? null);
      onRead();
    } catch (e) {
      toastError(e);
    }
  };
  const openNote = (n: Note) => {
    if (!n.link) return;
    onOpenChange(false);
    router.push(n.link);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("Bildirishnomalar")} closeLabel={t("Yopish")}>
      {items == null ? (
        <div className="space-y-2 py-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-fg/[0.05]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-neon/10 text-neon">
            <Bell className="size-7" />
          </span>
          <p className="mt-4 font-semibold">{t("Hozircha bildirishnoma yo'q")}</p>
          <p className="mt-1 max-w-xs text-sm text-muted">{t("Yangi matchlar, tayyor kliplar va boshqa xabarlar shu yerda chiqadi.")}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 pb-3 text-sm">
            <span className="text-subtle">{unread ? t("{n} ta o'qilmagan", { n: unread }) : t("Hammasi o'qilgan")}</span>
            <button onClick={readAll} disabled={!unread} className="font-semibold text-muted transition hover:text-fg disabled:opacity-50">
              {t("Hammasini o'qilgan deb belgilash")}
            </button>
          </div>
          <div className="-mx-4 divide-y divide-line border-t border-line">
            {items.map((n) => {
              const [Icon, bg] = NOTE_ICONS[n.icon] ?? NOTE_ICONS.bell;
              return (
                <button key={n.id} onClick={() => openNote(n)} className={cn("flex w-full items-start gap-3.5 px-5 py-4 text-left transition hover:bg-fg/[0.03]", !n.read_at && "bg-neon/[0.04]")}>
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-white", bg)}>
                    <Icon className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-semibold leading-snug">{n.title[lang] || n.title.uz}</span>
                      <span className="shrink-0 text-xs text-subtle">{ago(n.created_at, t)}</span>
                    </span>
                    {(n.body[lang] || n.body.uz) && <span className="mt-0.5 block text-sm leading-snug text-muted">{n.body[lang] || n.body.uz}</span>}
                  </span>
                  {!n.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-neon" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}

function TelegramRow({ state }: { state: ChromeUser["telegram"] }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (state === "unavailable") return <Row icon={<Send />} label="Telegram" soon />;
  const link = async () => {
    setBusy(true);
    try {
      const r = await api<{ url: string }>("/api/telegram/link", { method: "POST" });
      window.location.href = r.url;
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };
  const unlink = async () => {
    if (!confirm(t("Telegram'ni uzasizmi? Xabarlar kelmay qoladi."))) return;
    try {
      await api("/api/telegram/link", { method: "DELETE" });
      toast.success(t("Telegram uzildi"));
      router.refresh();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <Row
      icon={<Send />}
      label="Telegram"
      onClick={busy ? undefined : state === "linked" ? unlink : link}
      value={<span className={cn("text-sm", state === "linked" ? "text-neon" : "text-subtle")}>{t(state === "linked" ? "Ulangan" : busy ? "Ochilmoqda…" : "Ulash")}</span>}
    />
  );
}

function SteamGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-9.96 9.04l5.35 2.21a2.83 2.83 0 0 1 1.6-.49l2.39-3.46v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.4 2.43a2.84 2.84 0 0 1-5.62.55L2.2 14.3A10 10 0 1 0 12 2Zm-3.72 15.18-1.23-.5a2.13 2.13 0 1 0 1.17-2.9l1.27.52a1.57 1.57 0 1 1-1.2 2.9Zm9.53-7.92a2.52 2.52 0 1 0-2.52 2.52 2.52 2.52 0 0 0 2.52-2.52Zm-4.4 0a1.89 1.89 0 1 1 1.88 1.89 1.89 1.89 0 0 1-1.89-1.89Z" />
    </svg>
  );
}

function FaceitGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M21 3 3 11.2l8.4 1.4L13 21 21 3Z" fill="#ff5500" />
    </svg>
  );
}
