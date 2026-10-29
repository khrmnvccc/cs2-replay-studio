"use client";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { LANG_COOKIE, THEME_COOKIE, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n";

const setCookie = (k: string, v: string) => {
  document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`;
};

export function LangSwitch({ className }: { className?: string }) {
  const { lang } = useI18n();
  const router = useRouter();
  const pick = (l: Lang) => {
    if (l === lang) return;
    setCookie(LANG_COOKIE, l);
    document.documentElement.setAttribute("lang", l);
    router.refresh();
  };
  return (
    <div className={cn("grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-2 p-1", className)} role="group" aria-label="Til / Язык">
      {(["uz", "ru"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          aria-pressed={lang === l}
          className={cn("h-8 rounded-lg text-xs font-semibold transition", lang === l ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setCookie(THEME_COOKIE, next ? "dark" : "light");
  };
  // Ikonka CSS (dark:) orqali almashadi — server va klient bir xil chizadi.
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn("grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted backdrop-blur-xl transition hover:text-fg", className)}
      aria-label={t("Yorug' / tungi rejim")}
      title={t("Yorug' / tungi rejim")}
    >
      <Moon className="size-[18px] dark:hidden" />
      <Sun className="hidden size-[18px] dark:block" />
    </button>
  );
}
