"use client";

import { useCallback, useEffect, useState } from "react";
import type { HotListResponse, SourceConfig } from "@/lib/types";
import { HotItemRow } from "./HotItemRow";

interface SourceCardProps {
  source: SourceConfig;
  limit?: number;
  compact?: boolean;
  className?: string;
}

export function SourceCard({
  source,
  limit = 20,
  compact = true,
  className = "",
}: SourceCardProps) {
  const [data, setData] = useState<HotListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (force) setRefreshing(true);
      else {
        setLoading(true);
        setError(false);
      }

      try {
        const url = force
          ? `/api/hot/${source.id}?force=1`
          : `/api/hot/${source.id}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error("fetch failed");
        setData(await r.json());
        setError(false);
      } catch {
        if (!force) setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [source.id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const cardLoading = loading && !data;
  const showError = error && !data && !refreshing;

  return (
    <article
      className={`glass animate-fade-up flex flex-col overflow-hidden rounded-2xl ${className}`}
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
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            aria-label={`刷新${source.name}`}
            title="刷新热榜"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.07] text-white/65 transition hover:border-white/20 hover:bg-white/10 hover:text-white/85 disabled:cursor-wait disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative h-[280px] overflow-y-auto overscroll-contain px-2 pb-3 sm:px-3">
        {refreshing && data && (
          <div className="pointer-events-none absolute inset-0 z-10 bg-black/20" />
        )}
        {cardLoading && (
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

        {showError && (
          <div className="flex flex-col items-center gap-3 px-3 py-6">
            <p className="text-center text-sm text-[var(--color-muted)]">
              加载失败
            </p>
            <button
              type="button"
              onClick={() => load(true)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/5"
            >
              重试
            </button>
          </div>
        )}

        {data && !cardLoading && !showError && (
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

      {data?.updateTime && !cardLoading && (
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
