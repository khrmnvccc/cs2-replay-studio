import { Logo } from "@/components/brand";

export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Logo />
      <h1 className="mt-10 font-display text-4xl font-bold uppercase">Server hali sozlanmagan</h1>
      <p className="mt-3 text-muted">
        Quyidagi muhit o&apos;zgaruvchilari yo&apos;q yoki noto&apos;g&apos;ri. Sayt egasi ularni{" "}
        <span className="font-mono text-fg">Vercel → Settings → Environment Variables</span> ga qo&apos;shib, qayta deploy
        qilishi kerak (lokalda: <span className="font-mono text-fg">.env.local</span>, README → &quot;Lokal ishga tushirish&quot;).
      </p>
      <ul className="mt-6 space-y-2">
        {missing.map((m) => (
          <li key={m} className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 font-mono text-sm text-danger">
            {m}
          </li>
        ))}
      </ul>
    </main>
  );
}
