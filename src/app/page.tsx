import Link from "next/link";
import { ArrowRight, Check, Cpu, FileSearch, Film, KeyRound, ListChecks, Lock, Scissors, Server, ShieldCheck, Wrench } from "lucide-react";
import { Logo, SteamSignInButton } from "@/components/brand";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { envStatus } from "@/lib/server/env";
import { getSession } from "@/lib/server/session";

const STEPS = [
  { icon: KeyRound, title: "Steam ulash", text: "Steam OpenID orqali xavfsiz kirish. Parol faqat Steam saytida kiritiladi." },
  { icon: ListChecks, title: "Match topish", text: "Valve match history API (share code) orqali matchlaringiz ro'yxati." },
  { icon: FileSearch, title: "Demo tahlili", text: "Demo fayl serverda parse qilinadi: raundlar, killlar, qurol, headshot." },
  { icon: Scissors, title: "Kill klipi", text: "Bitta yoki barcha killlarni tanlang — oldingi va keyingi soniyalar bilan." },
  { icon: Film, title: "Yuklab olish", text: "CS2 + HLAE orqali haqiqiy MP4 render. Bitta fayl yoki ZIP arxiv." },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Haqiqiy Steam OpenID",
    text: "Steam javobi serverda check_authentication bilan qayta tekshiriladi, nonce takrorlanishi bloklanadi, session'lar bazada boshqariladi.",
    span: "lg:col-span-2",
  },
  { icon: Lock, title: "Faqat sizning ma'lumotingiz", text: "Supabase Row Level Security: har bir so'rov sizning ID ingiz bilan cheklangan.", span: "" },
  { icon: Cpu, title: "Og'ir ishlar — worker'da", text: "Demo tahlili, yuklash va render Vercel funksiyalarida emas, alohida job worker'da bajariladi.", span: "" },
  {
    icon: Film,
    title: "Kill xronologiyasi",
    text: "Har bir kill: raund, vaqt, killer, raqib, qurol, headshot, wallbang, noscope. Tanlang — clip navbatga tushadi va progress ko'rinadi.",
    span: "lg:col-span-2",
  },
];

const MATRIX = [
  { what: "Steam akkaunt, avatar, nickname", how: "Avtomatik — Steam OpenID + Steam Web API", auto: true },
  { what: "Match ro'yxati (share code'lar)", how: "Steam'dagi Game Authentication Code + oxirgi share code bir marta kiritiladi", auto: true },
  { what: "Match sanasi, hisob, K/D, demo havolasi", how: "Valve Game Coordinator — alohida Steam bot akkaunt bilan worker", auto: false },
  { what: "Demo tahlili va kill eventlar", how: "Avtomatik — siz yuklagan yoki Valve'dan olingan demo fayldan", auto: true },
  { what: "MP4 video render", how: "Windows render worker: CS2 + HLAE + CS Demo Manager + FFmpeg", auto: false },
];

export default async function Landing({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const authError = typeof sp.auth_error === "string" ? sp.auth_error : null;
  const configured = envStatus().ok;
  const user = configured ? await getSession().catch(() => null) : null;

  return (
    <div className="relative overflow-x-clip">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(143,107,255,0.16),transparent)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#how" className="transition hover:text-fg">Qanday ishlaydi</a>
          <a href="#features" className="transition hover:text-fg">Imkoniyatlar</a>
          <a href="#limits" className="transition hover:text-fg">Cheklovlar</a>
        </nav>
        {user ? (
          <Button asChild variant="secondary" size="md">
            <Link href="/dashboard">
              Bosh sahifa <ArrowRight />
            </Link>
          </Button>
        ) : (
          <a href="/api/auth/steam/login" className="text-sm font-medium text-fg/90 transition hover:text-neon">
            Kirish
          </a>
        )}
      </header>

      {authError && (
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="rounded-xl border border-danger/30 bg-danger/[0.08] px-4 py-3 text-sm text-danger">{authError}</div>
        </div>
      )}

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-3 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-neon" /> Counter-Strike 2 · Source 2 demo
          </div>
          <h1 className="mt-6 font-display text-[2.9rem] min-[400px]:text-[3.4rem] font-bold uppercase leading-[0.9] tracking-tight sm:text-7xl xl:text-[5.6rem]">
            Har bir kill —
            <br />
            <span className="text-gradient">tayyor lavha.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Steam akkauntingizni ulang, CS2 matchlaringizni ko&apos;ring, demo fayldan barcha kill lavhalarini toping va ularni MP4 qilib yuklab oling.
          </p>
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center [&>*]:justify-center">
            {user ? (
              <Button asChild variant="primary" size="lg">
                <Link href="/dashboard">
                  Bosh sahifaga o&apos;tish <ArrowRight />
                </Link>
              </Button>
            ) : (
              <SteamSignInButton label="Steam orqali kirish" />
            )}
            <Button asChild variant="ghost" size="lg">
              <a href="#how">Qanday ishlaydi</a>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-subtle">
            <Lock className="size-3.5" /> Steam parolingiz hech qachon bu saytga kiritilmaydi va saqlanmaydi.
          </p>
        </div>
        <HeroVisual />
      </section>

      {/* PROCESS */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
        <Reveal>
          <div className="label">Ishlash jarayoni</div>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Besh qadamda demo&apos;dan videoga</h2>
        </Reveal>
        <div className="relative mt-14 grid gap-4 md:grid-cols-5">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-neon/40 to-transparent md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="group relative h-full rounded-2xl border border-line bg-surface/80 p-5 transition duration-300 hover:-translate-y-1 hover:border-neon/30">
                <div className="relative z-10 grid size-14 place-items-center rounded-2xl border border-line-strong bg-bg text-neon transition group-hover:neon-ring">
                  <s.icon className="size-6" />
                </div>
                <div className="mt-5 font-mono text-xs text-subtle">0{i + 1}</div>
                <h3 className="mt-1 font-display text-xl font-semibold uppercase">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
        <Reveal>
          <div className="label">Imkoniyatlar</div>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Prototip emas — ishlaydigan platforma</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06} className={f.span}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-surface-2 to-surface p-7 transition duration-300 hover:border-white/15">
                <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet/10 blur-3xl transition group-hover:bg-neon/10" />
                <f.icon className="size-7 text-neon" />
                <h3 className="mt-6 font-display text-2xl font-semibold uppercase">{f.title}</h3>
                <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HONEST LIMITS */}
      <section id="limits" className="relative z-10 mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8">
        <Reveal>
          <div className="label">Halol cheklovlar</div>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Valve nimani beradi, nimani bermaydi</h2>
          <p className="mt-5 max-w-2xl text-muted">
            Steam Web API tayyor kill videolarini va barcha demo fayllarni bermaydi. Shuning uchun har bir funksiya qaysi manbaga tayanishini ochiq ko&apos;rsatamiz — soxta match yoki soxta video yo&apos;q.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 overflow-hidden rounded-3xl border border-line">
            {MATRIX.map((r, i) => (
              <div key={r.what} className={`grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center sm:gap-6 sm:px-7 ${i % 2 ? "bg-surface/60" : "bg-surface"}`}>
                <div className="font-medium">{r.what}</div>
                <div className="text-sm text-muted">{r.how}</div>
                <div>
                  {r.auto ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neon">
                      <Check className="size-3.5" /> Avtomatik
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warn">
                      <Wrench className="size-3.5" /> Qo&apos;shimcha sozlash
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-neon/20 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(143,107,255,0.22),transparent_60%),radial-gradient(70%_120%_at_0%_100%,rgba(180,255,46,0.14),transparent_60%),#0b0d10] px-6 py-14 text-center sm:px-12">
            <Server className="mx-auto size-8 text-neon" />
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Birinchi demo&apos;ingizni tahlil qiling</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">Steam bilan kiring, demo faylni yuklang va bir necha soniyada barcha killlaringiz ro&apos;yxatini oling.</p>
            <div className="mt-8 flex justify-center">{user ? <Button asChild variant="primary" size="lg"><Link href="/dashboard">Bosh sahifa</Link></Button> : <SteamSignInButton />}</div>
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Logo />
          <p>Valve Corporation bilan bog&apos;liq emas. Counter-Strike va Steam — Valve Corporation savdo belgilari.</p>
        </div>
      </footer>
    </div>
  );
}
