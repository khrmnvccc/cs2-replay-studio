import Link from "next/link";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <Logo />
      <div className="panel mt-10 w-full p-8">
        <div className="font-mono text-sm text-subtle">404</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("Sahifa topilmadi")}</h1>
        <p className="mt-3 text-muted">{t("Bunday sahifa yo'q yoki o'chirilgan.")}</p>
        <Button asChild variant="primary" className="mt-8">
          <Link href="/">{t("Bosh sahifaga qaytish")}</Link>
        </Button>
      </div>
    </main>
  );
}
