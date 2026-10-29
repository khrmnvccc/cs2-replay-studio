import Link from "next/link";
import { ArrowRight, Crosshair, FileSearch, Film, KeyRound, ListChecks, Lock, Scissors, Server, ShieldCheck, Smartphone } from "lucide-react";
import { Logo, SteamSignInButton } from "@/components/brand";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { envStatus } from "@/lib/server/env";
import { getSession } from "@/lib/server/session";
import { LangSwitch, ThemeToggle } from "@/components/prefs";
import { getT } from "@/lib/i18n/server";

const STEPS = [
  { icon: KeyRound, title: "Steam bilan kiring", text: "Bir bosishda Steam orqali kirasiz. Parolingiz faqat Steam saytida kiritiladi." },
  { icon: ListChecks, title: "Matchlar o'zi chiqadi", text: "Bir marta 2 ta kod kiritasiz — yangi matchlaringiz avtomatik paydo bo'ladi." },
  { icon: FileSearch, title: "Killlar ro'yxati", text: "Har bir matchdagi killlaringiz: raund, qurol, headshot." },
  { icon: Scissors, title: "Eng zo'rlarini tanlang", text: "Bitta yoki barcha killlarni tanlang." },
  { icon: Film, title: "Video qilib oling", text: "Tanlangan lavhalar MP4 video bo'lib yuklab olinadi." },
];

const FEATURES = [
  { icon: ShieldCheck, title: "Xavfsiz kirish", text: "Faqat rasmiy Steam orqali kirasiz. Parolingiz bizga kelmaydi.", span: "lg:col-span-2" },
  { icon: Lock, title: "Faqat siz ko'rasiz", text: "Matchlaringiz va kliplaringizni boshqa hech kim ko'rmaydi.", span: "" },
  { icon: Smartphone, title: "Telefonda ham qulay", text: "Saytni ilova qilib o'rnating — bir bosishda ochiladi.", span: "" },
  { icon: Crosshair, title: "Har bir kill batafsil", text: "Raund, vaqt, raqib, qurol, headshot, wallbang, noscope — hammasi bir joyda.", span: "lg:col-span-2" },
];

export default async function Landing({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const authError = typeof sp.auth_error === "string" ? sp.auth_error : null;
  const configured = envStatus().ok;
  const user = configured ? await getSession().catch(() => null) : null;
  const { t } = await getT();

  return (
    <div className="relative overflow-x-clip">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Logo />
        <nav className="glass hidden items-center gap-1 rounded-2xl p-1 text-sm text-muted md:flex">
          <a href="#how" className="rounded-xl px-4 py-2 transition hover:bg-fg/5 hover:text-fg">{t("Qanday ishlaydi")}</a>
          <a href="#features" className="rounded-xl px-4 py-2 transition hover:bg-fg/5 hover:text-fg">{t("Imkoniyatlar")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch className="w-24" />
          <ThemeToggle />
          {user ? (
            <Button asChild variant="secondary" size="md" className="hidden sm:inline-flex">
              <Link href="/matches">
                {t("Bosh sahifa")} <ArrowRight />
              </Link>
            </Button>
          ) : (
            <a href="/api/auth/steam/login" className="hidden text-sm font-medium text-fg/90 transition hover:text-neon sm:inline">
              {t("Kirish")}
            </a>
          )}
        </div>
      </header>

      {authError && (
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-2xl border border-danger/30 bg-danger/[0.08] px-4 py-3 text-sm text-danger">{t(authError)}</div>
        </div>
      )}

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="animate-fade-up">
          <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-neon" /> Counter-Strike 2 · Source 2 demo
          </div>
          <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.02] tracking-tight min-[400px]:text-5xl sm:text-6xl xl:text-7xl">
            {t("Har bir kill —")}
            <br />
            <span className="text-gradient">{t("tayyor lavha.")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {t("Steam akkauntingizni ulang, CS2 matchlaringizni ko'ring, demo fayldan barcha kill lavhalarini toping va ularni MP4 qilib yuklab oling.")}
          </p>
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center [&>*]:justify-center">
            {user ? (
              <Button asChild variant="primary" size="lg">
                <Link href="/matches">
                  {t("Bosh sahifaga o'tish")} <ArrowRight />
                </Link>
              </Button>
            ) : (
              <SteamSignInButton label={t("Steam orqali kirish")} />
            )}
            <Button asChild variant="secondary" size="lg">
              <a href="#how">{t("Qanday ishlaydi")}</a>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-subtle">
            <Lock className="size-3.5" /> {t("Steam parolingiz hech qachon bu saytga kiritilmaydi va saqlanmaydi.")}
          </p>
        </div>
        <HeroVisual />
      </section>

      {/* PROCESS */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
        <Reveal>
          <div className="label">{t("Ishlash jarayoni")}</div>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{t("Besh qadamda demo'dan videoga")}</h2>
        </Reveal>
        <div className="relative mt-14 grid gap-4 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="panel group relative h-full p-5 transition duration-300 hover:-translate-y-1">
                <div className="relative z-10 grid size-12 place-items-center rounded-2xl bg-neon/12 text-neon">
                  <s.icon className="size-6" />
                </div>
                <div className="mt-5 font-mono text-xs text-subtle">0{i + 1}</div>
                <h3 className="mt-1 text-lg font-semibold">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(s.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
        <Reveal>
          <div className="label">{t("Imkoniyatlar")}</div>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{t("Nima uchun ACE")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06} className={f.span}>
              <div className="panel group relative h-full overflow-hidden !rounded-3xl p-7 transition duration-300">
                <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet/10 blur-3xl transition group-hover:bg-neon/10" />
                <f.icon className="size-7 text-neon" />
                <h3 className="mt-6 text-xl font-semibold">{t(f.title)}</h3>
                <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted">{t(f.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8">
        <Reveal>
          <div className="panel relative overflow-hidden !rounded-[2rem] px-6 py-14 text-center sm:px-12">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-neon/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-violet/15 blur-3xl" />
            <Server className="relative mx-auto size-8 text-neon" />
            <h2 className="relative mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{t("Birinchi demo'ingizni tahlil qiling")}</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-muted">{t("Steam bilan kiring, demo faylni yuklang va bir necha soniyada barcha killlaringiz ro'yxatini oling.")}</p>
            <div className="relative mt-8 flex justify-center">
              {user ? (
                <Button asChild variant="primary" size="lg">
                  <Link href="/matches">{t("Bosh sahifa")}</Link>
                </Button>
              ) : (
                <SteamSignInButton label={t("Steam orqali kirish")} />
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p>{t("Valve Corporation bilan bog'liq emas. Counter-Strike va Steam — Valve Corporation savdo belgilari.")}</p>
        </div>
      </footer>
    </div>
  );
}
