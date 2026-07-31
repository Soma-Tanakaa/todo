"use client";

import type { TaskType } from "@/lib/types";

export function TypeSegment({
  value,
  onChange,
  compact,
}: {
  value: TaskType;
  onChange: (t: TaskType) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {(["must", "want"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-md font-medium transition-colors ${
            compact ? "px-2 py-1.5 text-xs" : "px-3 py-1.5 text-sm"
          } ${
            value === t
              ? t === "must"
                ? "bg-must text-white"
                : "bg-want text-white"
              : "text-gray-500"
          }`}
        >
          {t === "must"
            ? compact
              ? "やる"
              : "やること"
            : compact
              ? "やりたい"
              : "やりたいこと"}
        </button>
      ))}
    </div>
  );
}
