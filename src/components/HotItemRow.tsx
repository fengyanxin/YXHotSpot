function formatHot(hot?: string | number): string {
  if (hot == null || hot === "") return "";
  const n = typeof hot === "string" ? parseFloat(hot.replace(/[^\d.]/g, "")) : hot;
  if (Number.isNaN(n)) return String(hot);
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  return String(n);
}

function rankStyle(rank: number): string {
  if (rank === 1) return "bg-gradient-to-br from-[var(--color-gold)] to-[#e6a800] text-black";
  if (rank === 2) return "bg-gradient-to-br from-[var(--color-silver)] to-[#8fa3b8] text-black";
  if (rank === 3) return "bg-gradient-to-br from-[var(--color-bronze)] to-[#a0522d] text-white";
  return "bg-white/8 text-[var(--color-muted)]";
}

interface HotItemRowProps {
  rank: number;
  title: string;
  url: string;
  hot?: string | number;
  accentColor?: string;
  compact?: boolean;
}

export function HotItemRow({
  rank,
  title,
  url,
  hot,
  accentColor,
  compact,
}: HotItemRowProps) {
  const hotLabel = formatHot(hot);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-3 rounded-xl px-2 py-2 transition-all hover:bg-white/[0.04] ${
        compact ? "py-1.5" : ""
      }`}
      style={{ animationDelay: `${rank * 30}ms` }}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums ${rankStyle(rank)}`}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`leading-snug text-white/90 transition group-hover:text-white ${
            compact ? "text-sm line-clamp-1" : "text-sm sm:text-[15px] line-clamp-2"
          }`}
        >
          {title}
        </p>
        {hotLabel && !compact && (
          <span
            className="mt-0.5 inline-block text-xs text-[var(--color-muted)]"
            style={{ color: accentColor ? `${accentColor}99` : undefined }}
          >
            {hotLabel} 热度
          </span>
        )}
      </div>
      <svg
        className="mt-1 h-4 w-4 shrink-0 text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}
