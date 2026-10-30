import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/components/i18n";
import { InstallPrompt } from "@/components/install-prompt";
import { ConfirmHost } from "@/components/ui/confirm";
import { getLang, getTheme } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    applicationName: "ACE",
    title: { default: "ACE · CS2 Match Replay", template: "%s · ACE" },
    appleWebApp: { capable: true, title: "ACE", statusBarStyle: "default" },
    description: translate(lang, "Steam akkauntingizni ulang, CS2 matchlaringizni ko'ring, demo'dan kill lavhalarini toping va MP4 qilib yuklab oling."),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1726" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [lang, theme] = await Promise.all([getLang(), getTheme()]);
  return (
    <html lang={lang} className={`${jakarta.variable} ${inter.variable} ${mono.variable} h-full ${theme === "dark" ? "dark" : ""}`}>
      <body className="min-h-full">
        <I18nProvider lang={lang}>
          {children}
          <InstallPrompt />
          <ConfirmHost />
        </I18nProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "var(--color-surface)", backdropFilter: "blur(20px)", border: "1px solid var(--color-glass-edge)", color: "var(--color-fg)" },
          }}
        />
      </body>
    </html>
  );
}
