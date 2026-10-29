import Link from "next/link";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <Logo />
      <div className="mt-10 font-mono text-sm text-subtle">404</div>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase">Sahifa topilmadi</h1>
      <p className="mt-3 text-muted">Bunday sahifa yo&apos;q yoki o&apos;chirilgan.</p>
      <Button asChild variant="primary" className="mt-8">
        <Link href="/">Bosh sahifaga qaytish</Link>
      </Button>
    </main>
  );
}
