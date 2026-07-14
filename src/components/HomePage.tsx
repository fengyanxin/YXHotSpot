"use client";

import { useMemo, useState } from "react";
import type { SourceCategory } from "@/lib/types";
import {
  SOURCES,
  getFeaturedSources,
  getSourcesByCategory,
  groupSourcesByCategory,
} from "@/lib/sources";
import { Header } from "./Header";
import { CategoryFilter } from "./CategoryFilter";
import { SourceCard } from "./SourceCard";

function SourceGrid({
  sources,
  delayOffset = 0,
}: {
  sources: typeof SOURCES;
  delayOffset?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sources.map((source, i) => (
        <SourceCard
          key={source.id}
          source={source}
          limit={20}
          delayMs={(delayOffset + i) * 50}
        />
      ))}
    </div>
  );
}

export function HomePage() {
  const [category, setCategory] = useState<SourceCategory | "全部">("全部");

  const featured = getFeaturedSources();
  const filtered =
    category === "全部"
      ? SOURCES
      : getSourcesByCategory(category);

  const grouped = useMemo(
    () => (category === "全部" ? groupSourcesByCategory(SOURCES) : []),
    [category]
  );

  return (
    <>
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <section className="mb-12 text-center sm:mb-16">
          <p className="mb-3 text-sm font-medium tracking-widest text-[var(--color-accent)] uppercase">
            Real-time Aggregation
          </p>
          <h2
            className="mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            今日全网
            <span className="text-gradient"> 热点 </span>
            一览
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--color-muted)] sm:text-lg">
            聚合 {SOURCES.length} 个平台实时热榜
          </p>
        </section>

        <section id="featured" className="mb-14">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold sm:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              热门精选
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              微博 · 抖音 · 36氪
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featured.map((source, i) => (
              <SourceCard
                key={source.id}
                source={source}
                limit={20}
                delayMs={i * 80}
              />
            ))}
          </div>
        </section>

        <section id="all-sources">
          <div className="mb-6 space-y-4">
            <div>
              <h3
                className="text-xl font-semibold sm:text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                全部热榜
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {category === "全部"
                  ? `${grouped.length} 个分类 · 共 ${filtered.length} 个数据源`
                  : `${category} · ${filtered.length} 个数据源`}
              </p>
            </div>
            <CategoryFilter active={category} onChange={setCategory} />
          </div>

          {category === "全部" ? (
            <div className="space-y-10">
              {grouped.map(({ category: cat, sources }, gi) => (
                <div key={cat}>
                  <div className="mb-4 flex items-center gap-3">
                    <h4
                      className="text-lg font-semibold text-white/90"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {cat}
                    </h4>
                    <span className="text-xs text-[var(--color-muted)]">
                      {sources.length} 源
                    </span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <SourceGrid sources={sources} delayOffset={gi * 3} />
                </div>
              ))}
            </div>
          ) : (
            <SourceGrid sources={filtered} />
          )}
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted)]">
        <p>YX HotSpot · 数据直连各平台公开接口实时抓取</p>
        <p className="mt-1 text-xs opacity-60">
          仅供学习交流，请支持各平台原创内容
        </p>
      </footer>
    </>
  );
}
