"use client";

import { useEffect, useState } from "react";

export function Header() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleString("zh-CN", {
          month: "long",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[#ffb347] text-lg font-bold text-white shadow-lg shadow-[var(--color-accent)]/20">
            热
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse-glow rounded-full bg-white" />
          </div>
          <div>
            <h1
              className="text-xl font-semibold tracking-tight sm:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-gradient">YX HotSpot</span>
            </h1>
            <p className="text-xs text-[var(--color-muted)]">
              全网热点 · 一站尽览
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          <nav className="flex gap-1 text-sm text-[var(--color-muted)]">
            <a
              href="#featured"
              className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
            >
              热门
            </a>
            <a
              href="#all-sources"
              className="rounded-lg px-3 py-1.5 transition hover:bg-white/5 hover:text-white"
            >
              全部
            </a>
          </nav>
          <time className="text-sm tabular-nums text-[var(--color-muted)]">
            {time}
          </time>
        </div>
      </div>
    </header>
  );
}
