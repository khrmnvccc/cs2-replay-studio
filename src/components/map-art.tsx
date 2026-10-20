import { mapMeta } from "@shared/maps";
import { cn } from "@/lib/utils";

/** Xarita "rasmi": rasmiy rasm bo'lmasa — xarita rangidagi topografik gradient. */
export function MapArt({ map, className, size = "md" }: { map: string | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const m = mapMeta(map);
  const h = m.hue;
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: m.image
          ? `url(${m.image}) center/cover`
          : `radial-gradient(120% 90% at 85% 10%, hsl(${h} 70% 45% / 0.55), transparent 55%), radial-gradient(90% 80% at 0% 100%, hsl(${(h + 40) % 360} 60% 30% / 0.5), transparent 60%), linear-gradient(160deg, hsl(${h} 25% 12%), #0b0d10 70%)`,
      }}
      aria-label={m.name}
      role="img"
    >
      {!m.image && (
        <svg className="absolute inset-0 h-full w-full opacity-[0.22] mix-blend-screen" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <path
              key={i}
              d={`M -10 ${20 + i * 12} C 40 ${8 + i * 12 + ((h + i * 7) % 18)}, 90 ${30 + i * 11 - ((h * 3 + i) % 20)}, 210 ${14 + i * 12}`}
              fill="none"
              stroke={`hsl(${h} 80% 70%)`}
              strokeWidth="0.6"
            />
          ))}
        </svg>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className={cn("absolute bottom-0 left-0 p-3 font-display font-bold uppercase leading-none tracking-wide text-white drop-shadow", size === "lg" ? "p-5 text-5xl sm:text-6xl" : size === "sm" ? "text-base" : "text-2xl")}>
        {m.name}
      </div>
    </div>
  );
}
