"use client";

import { useEffect, useState } from "react";
import type { HotListResponse, SourceConfig } from "@/lib/types";
import { HotItemRow } from "./HotItemRow";

interface SourceCardProps {
  source: SourceConfig;
  limit?: number;
  compact?: boolean;
  className?: string;
  delayMs?: number;
}

export function SourceCard({
  source,
  limit = 20,
  compact = true,
  className = "",
  delayMs = 0,
}: SourceCardProps) {
  const [data, setData] = useState<HotListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(attempt = 0) {
      if (cancelled) return;
      setLoading(true);
      if (attempt === 0) setError(false);

      try {
        const r = await fetch(`/api/hot/${source.id}`);
        if (!r.ok) throw new Error("fetch failed");
        const json: HotListResponse = await r.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (cancelled) return;
        if (attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          return load(attempt + 1);
        }
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(() => load(), delayMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source.id, delayMs]);

  return (
    <article
      className={`glass animate-fade-up flex flex-col overflow-hidden rounded-2xl ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className="relative overflow-hidden px-4 py-4 sm:px-5"
        style={{
          background: `linear-gradient(135deg, ${source.color}18 0%, transparent 60%)`,
        }}
      >
        <div
          className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl"
          style={{ background: source.color }}
        />
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg"
            style={{ background: source.color }}
          >
            {source.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="truncate font-semibold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {source.name}
            </h3>
            <p className="truncate text-xs text-[var(--color-muted)]">
              {source.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="h-[280px] overflow-y-auto overscroll-contain px-2 pb-3 sm:px-3">
        {loading && (
          <div className="space-y-2 px-2 py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2">
                <div className="h-6 w-6 animate-pulse rounded-md bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-full animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">
            加载失败，请稍后刷新
          </p>
        )}

        {data && !loading && (
          <div className="divide-y divide-white/[0.04]">
            {data.data.slice(0, limit).map((item, i) => (
              <HotItemRow
                key={item.id}
                rank={i + 1}
                title={item.title}
                url={item.url}
                hot={item.hot}
                accentColor={source.color}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {data?.updateTime && !loading && (
        <footer className="border-t border-white/[0.04] px-4 py-2 text-center text-[10px] text-[var(--color-muted)]">
          更新于{" "}
          {new Date(data.updateTime).toLocaleString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </footer>
      )}
    </article>
  );
}
