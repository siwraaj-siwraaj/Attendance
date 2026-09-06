import React from "react";

interface SkeletonLoaderProps {
  count?: number;
  type?: "card" | "table-row" | "text" | "circle";
  className?: string;
}

export default function SkeletonLoader({
  count = 1,
  type = "text",
  className = "",
}: SkeletonLoaderProps) {
  const baseClass =
    "animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded";

  const typeClass =
    type === "card"
      ? "h-24 w-full rounded-xl"
      : type === "table-row"
        ? "h-10 w-full"
        : type === "circle"
          ? "h-10 w-10 rounded-full"
          : "h-4 w-full";

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders never reorder
          key={`skel-${i}`}
          className={`${baseClass} ${typeClass} ${className}`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-2">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders never reorder
            key={`hdr-${i}`}
            className="animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded h-8 flex-1"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders never reorder
        <div key={`row-${r}`} className="flex gap-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders never reorder
              key={`cell-${r}-${c}`}
              className="animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded h-10 flex-1"
              style={{ animationDelay: `${r * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders never reorder
          key={`card-skel-${i}`}
          className="glass-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded h-4 w-1/3" />
            <div className="animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded h-4 w-16 ml-auto" />
          </div>
          <div className="animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
