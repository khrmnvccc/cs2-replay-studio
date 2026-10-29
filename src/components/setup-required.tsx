import { Logo } from "@/components/brand";
import { getT } from "@/lib/i18n/server";

export async function SetupRequired({ missing }: { missing: string[] }) {
  const { t } = await getT();
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <Logo />
      <div className="panel mt-10 p-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("Server hali sozlanmagan")}</h1>
        <p className="mt-3 text-muted">{t("Quyidagi muhit o'zgaruvchilari yo'q yoki noto'g'ri. Sayt egasi ularni Vercel → Settings → Environment Variables ga qo'shib, qayta deploy qilishi kerak.")}</p>
        <ul className="mt-6 space-y-2">
          {missing.map((m) => (
            <li key={m} className="rounded-xl border border-danger/25 bg-danger/[0.06] px-3 py-2 font-mono text-sm text-danger">
              {m}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
