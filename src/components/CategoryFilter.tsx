"use client";

import type { SourceCategory } from "@/lib/types";
import { CATEGORIES } from "@/lib/sources";

interface CategoryFilterProps {
  active: SourceCategory | "全部";
  onChange: (cat: SourceCategory | "全部") => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${
            active === cat
              ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/25"
              : "glass text-[var(--color-muted)] hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
