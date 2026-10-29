import type { MetadataRoute } from "next";

// Saytni telefonga/kompyuterga ilova sifatida o'rnatish (PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ACE · CS2 Match Replay",
    short_name: "ACE",
    description: "CS2 matchlaringiz, kill lavhalari va kliplar",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2f7",
    theme_color: "#16a34a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
