"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  ChevronRight,
  Compass,
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
import { cn } from "@/lib/utils";

export type ChromeUser = { name: string; avatarUrl: string | null; historyEnabled: boolean; owner: boolean };

type Ctx = { user: ChromeUser; openMenu: () => void; openBell: () => void };
const ChromeCtx = createContext<Ctx | null>(null);
const useChrome = () => {
  const c = useContext(ChromeCtx);
  if (!c) throw new Error("AppChrome ichida ishlating");
  return c;
};

const TABS = [
  { href: "/matches", label: "Matchlar", icon: LayoutGrid },
  { href: "/clips", label: "Kliplar", icon: PlaySquare },
  { href: "/reels", label: "Reels", icon: Compass },
  { href: "#menu", label: "Menyu", icon: Menu },
  { href: "/stats", label: "Statistika", icon: BarChart3 },
] as const;

const TITLES: [string, string, typeof LayoutGrid][] = [
  ["/matches", "Matchlar", LayoutGrid],
  ["/clips", "Kliplar", PlaySquare],
  ["/reels", "Reels", Compass],
  ["/stats", "Statistika", BarChart3],
  ["/settings", "Sozlamalar", Settings],
  ["/system", "Tizim holati", Server],
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/** Ilova "qobig'i": menyu va bildirishnoma oynalari bitta joyda, istalgan tugmadan ochiladi. */
export function AppChrome({ user, children }: { user: ChromeUser; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  return (
    <ChromeCtx.Provider value={{ user, openMenu: () => setMenu(true), openBell: () => setBell(true) }}>
      {children}
      <MenuSheet open={menu} onOpenChange={setMenu} user={user} />
      <BellSheet open={bell} onOpenChange={setBell} />
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
  const { user, openMenu, openBell } = useChrome();
  const t = useT();
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
      <button onClick={openBell} className="grid size-10 place-items-center rounded-full text-muted transition hover:text-fg" aria-label={t("Bildirishnomalar")}>
        <Bell className="size-5" />
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
    <nav className="glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-[1.75rem] p-1.5 lg:hidden">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href !== "#menu" && isActive(path, href);
        const cls = cn("flex min-w-0 flex-col items-center gap-1 rounded-[1.25rem] py-2 text-[11px] font-medium transition", active ? "bg-neon/12 text-neon" : "text-muted");
        const inner = (
          <>
            <Icon className="size-5" />
            <span className="max-w-full truncate px-0.5">{t(label)}</span>
          </>
        );
        return href === "#menu" ? (
          <button key={href} type="button" onClick={openMenu} className={cls}>
            {inner}
          </button>
        ) : (
          <Link key={href} href={href} className={cls}>
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
    { href: "/settings", label: "Sozlamalar", icon: Settings },
    ...(user.owner ? [{ href: "/system", label: "Tizim holati", icon: Server }] : []),
  ];
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
              active ? "bg-neon/10 text-neon" : "text-muted hover:bg-fg/[0.04] hover:text-fg",
            )}
          >
            <Icon className="size-[18px]" />
            {t(label)}
          </Link>
        );
      })}
      <button onClick={openMenu} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-muted transition-colors hover:bg-fg/[0.04] hover:text-fg">
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
          <Row icon={<Send />} label="Telegram" soon />
        </ListGroup>

        <ListGroup label={t("O'yiningiz")}>
          <Row icon={<Wand2 />} label="Skin changer" soon />
          <Row icon={<MapIcon />} label="Xaritalar" soon />
          <Row icon={<MapPin />} label="Xarita joy nomlari" soon />
          <Row icon={<Medal />} label="Turnirlar" soon />
          <Row icon={<Trophy />} label="Rekordlar" soon />
          <Row icon={<Users />} label="Do'stlar" soon />
        </ListGroup>

        <ListGroup label={t("Ilova")}>
          <Row icon={<Settings />} label="Sozlamalar" href="/settings" />
          <Row icon={<Moon />} label="Tungi rejim" onClick={toggleTheme} />
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

function BellSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t("Bildirishnomalar")} closeLabel={t("Yopish")}>
      <div className="grid place-items-center px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-neon/10 text-neon">
          <Bell className="size-7" />
        </span>
        <p className="mt-4 font-semibold">{t("Tez orada")}</p>
        <p className="mt-1 max-w-xs text-sm text-muted">{t("Yangi matchlar, tayyor kliplar va boshqa xabarlar shu yerda chiqadi.")}</p>
      </div>
    </Sheet>
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
