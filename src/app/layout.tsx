import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "CS2 Match Replay Studio", template: "%s · Replay Studio" },
  description: "Steam akkauntingizni ulang, CS2 matchlaringizni ko'ring, demo'dan kill lavhalarini toping va MP4 qilib yuklab oling.",
};

export const viewport: Viewport = { themeColor: "#07080a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} ${barlow.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{ style: { background: "#13161a", border: "1px solid rgb(255 255 255 / 0.1)", color: "#eceef1" } }}
        />
      </body>
    </html>
  );
}
