"use client";

import type { DragEvent } from "react";
import { formatMD, todayIso } from "@/lib/date";
import type { ListItem, ListName } from "@/lib/types";
import { DuePill } from "./pills";

interface DoListsProps {
  items: ListItem[];
  onDrop: (list: ListName, e: DragEvent) => void;
  onRemove: (item: ListItem) => void;
  onToggle: (item: ListItem) => void;
}

export function DoLists({ items, onDrop, onRemove, onToggle }: DoListsProps) {
  return (
    <div className="flex w-[336px] flex-none flex-col gap-7 overflow-auto border-l border-divider bg-n100 p-6">
      <Zone
        list="today"
        label="今日やる"
        right={formatMD(todayIso())}
        kickerClass="text-accent-700"
        items={items.filter((i) => i.list === "today")}
        onDrop={onDrop}
        onRemove={onRemove}
        onToggle={onToggle}
      />
      <Zone
        list="later"
        label="明日以降やる"
        kickerClass="text-n700"
        items={items.filter((i) => i.list === "later")}
        onDrop={onDrop}
        onRemove={onRemove}
        onToggle={onToggle}
      />
    </div>
  );
}

function Zone({
  list,
  label,
  right,
  kickerClass,
  items,
  onDrop,
  onRemove,
  onToggle,
}: {
  list: ListName;
  label: string;
  right?: string;
  kickerClass: string;
  items: ListItem[];
  onDrop: (list: ListName, e: DragEvent) => void;
  onRemove: (item: ListItem) => void;
  onToggle: (item: ListItem) => void;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => onDrop(list, e)}
    >
      <div className="mb-[10px] flex items-baseline justify-between">
        <span className={`text-xs tracking-[3px] ${kickerClass}`}>{label}</span>
        {right && <span className="text-xs text-n600">{right}</span>}
      </div>
      <div className="min-h-24 rounded-xl border border-dashed border-n400 px-[14px] py-[10px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="mb-[10px] flex items-start gap-[10px] rounded-2xl border border-n400 bg-white px-3 py-[10px] shadow-card"
          >
            <button
              type="button"
              onClick={() => onToggle(item)}
              aria-label={item.checked ? "未完了に戻す" : "完了にする"}
              className={`mt-[3px] flex h-[15px] w-[15px] flex-none cursor-pointer items-center justify-center rounded-full border-[1.5px] ${
                item.checked
                  ? "border-n800 bg-n800 text-[9px] leading-none text-white"
                  : "border-n400 bg-transparent"
              }`}
            >
              {item.checked ? "✓" : ""}
            </button>
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[15px] leading-[1.25] font-bold ${
                  item.checked ? "text-n500 line-through" : "text-n900"
                }`}
              >
                {item.title}
              </span>
              <span className="mt-[5px] flex items-center gap-[6px]">
                <span className="truncate text-[11.5px] text-n600">{item.path}</span>
                {item.due_date && <DuePill due={item.due_date} />}
              </span>
            </span>
            <span
              onClick={() => onRemove(item)}
              className="cursor-pointer px-[2px] text-[13px] text-n500 hover:text-accent-700"
            >
              ×
            </span>
          </div>
        ))}
        <div className="py-[10px] text-center text-xs text-n500">
          ツリーからここへドラッグでコピー
        </div>
      </div>
    </div>
  );
}
