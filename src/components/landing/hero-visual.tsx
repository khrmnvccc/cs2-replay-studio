"use client";
import { motion } from "motion/react";

// Illyustratsiya: demo timeline'ining abstrakt ko'rinishi (haqiqiy ma'lumot emas).
const ROUNDS = [3, 1, 2, 0, 4, 1, 2, 3, 0, 1, 5, 2];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden>
      <div className="absolute -inset-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(180,255,46,0.14),transparent)] blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-neon animate-pulse-soft" />
            <span className="label !text-muted">demo xronologiyasi</span>
          </div>
          <span className="label">illustratsiya</span>
        </div>

        {/* Crosshair + radar */}
        <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-[radial-gradient(80%_80%_at_50%_50%,#141a12,#0a0c0e)]">
          <div className="grid-bg absolute inset-0 opacity-70" />
          <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
            <defs>
              <radialGradient id="sweep" cx="0" cy="0" r="1">
                <stop offset="0" stopColor="#b4ff2e" stopOpacity="0.35" />
                <stop offset="1" stopColor="#b4ff2e" stopOpacity="0" />
              </radialGradient>
            </defs>
            {[28, 52, 76].map((r) => (
              <circle key={r} cx="160" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.08)" />
            ))}
            <motion.path
              d="M160 90 L236 90 A76 76 0 0 0 214 37 Z"
              fill="url(#sweep)"
              style={{ originX: "160px", originY: "90px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <g stroke="#b4ff2e" strokeWidth="1.6" strokeLinecap="round">
              <line x1="160" y1="74" x2="160" y2="84" />
              <line x1="160" y1="96" x2="160" y2="106" />
              <line x1="144" y1="90" x2="154" y2="90" />
              <line x1="166" y1="90" x2="176" y2="90" />
            </g>
            {[
              [118, 62],
              [204, 118],
              [226, 70],
              [96, 128],
            ].map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="3.2"
                fill={i % 2 ? "#8f6bff" : "#b4ff2e"}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.5], scale: [0, 1.4, 1] }}
                transition={{ delay: 0.6 + i * 0.5, duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
              />
            ))}
          </svg>
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full bg-gradient-to-r from-neon-dim to-neon" initial={{ width: "8%" }} animate={{ width: "72%" }} transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} />
            </div>
            <span className="rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-neon">MP4</span>
          </div>
        </div>

        {/* Raundlar va kill markerlari */}
        <div className="mt-5 flex items-end gap-1.5">
          {ROUNDS.map((k, i) => (
            <motion.div
              key={i}
              className="flex flex-1 flex-col justify-end gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              {Array.from({ length: k }).map((_, j) => (
                <span key={j} className="h-1.5 rounded-sm bg-neon/80 shadow-[0_0_8px_rgba(180,255,46,0.6)]" />
              ))}
              <span className={`h-6 rounded-md ${i % 3 === 1 ? "bg-tside/25" : "bg-ct/20"}`} />
            </motion.div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-subtle">
          <span>R1</span>
          <span>raundlar · kill markerlari</span>
          <span>R12</span>
        </div>
      </motion.div>
    </div>
  );
}
