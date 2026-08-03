"use client";

import type { DragEvent } from "react";
import { formatMD, todayIso } from "@/lib/date";
import type { ListItem, ListName, ViewListItem } from "@/lib/types";
import { DuePill } from "./pills";

interface DoListsProps {
  items: ViewListItem[];
  /** 端末ローカルの今日(マウント前はnull) */
  today: string | null;
  onDrop: (list: ListName, e: DragEvent) => void;
  onRemove: (item: ListItem) => void;
  onToggle: (item: ViewListItem) => void;
  onItemDragStart: (item: ListItem) => void;
}

export function DoLists({
  items,
  today,
  onDrop,
  onRemove,
  onToggle,
  onItemDragStart,
}: DoListsProps) {
  const t = today ?? todayIso();
  // 日跨ぎは表示時に導出する: 今日やるのうち昨日以前に載せた未処理分が「未完了(持ち越し)」
  const carry = items
    .filter((x) => x.list === "today" && x.listed_on < t)
    .sort((a, b) => a.listed_on.localeCompare(b.listed_on));
  const todayItems = items.filter((x) => x.list === "today" && x.listed_on >= t);
  const laterItems = items.filter((x) => x.list === "later");

  return (
    <div className="flex w-[336px] flex-none flex-col gap-7 overflow-auto border-l border-divider bg-n100 p-6">
      {carry.length > 0 && (
        <div>
          <div className="mb-[10px] flex items-baseline justify-between">
            <span className="text-xs tracking-[3px] text-overdue">
              未完了 ─ 持ち越し
            </span>
          </div>
          {carry.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              carryFrom={item.listed_on}
              onRemove={onRemove}
              onToggle={onToggle}
              onItemDragStart={onItemDragStart}
            />
          ))}
          <div className="text-center text-xs leading-[1.7] text-n500">
            チェックで完了 ・ 下の欄へドラッグで今日/明日以降へ
          </div>
        </div>
      )}
      <Zone
        list="today"
        label="今日やる"
        right={today ? formatMD(today) : ""}
        kickerClass="text-accent-700"
        items={todayItems}
        onDrop={onDrop}
        onRemove={onRemove}
        onToggle={onToggle}
        onItemDragStart={onItemDragStart}
      />
      <Zone
        list="later"
        label="明日以降やる"
        kickerClass="text-n700"
        items={laterItems}
        onDrop={onDrop}
        onRemove={onRemove}
        onToggle={onToggle}
        onItemDragStart={onItemDragStart}
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
  onItemDragStart,
}: {
  list: ListName;
  label: string;
  right?: string;
  kickerClass: string;
  items: ViewListItem[];
  onDrop: (list: ListName, e: DragEvent) => void;
  onRemove: (item: ListItem) => void;
  onToggle: (item: ViewListItem) => void;
  onItemDragStart: (item: ListItem) => void;
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
          <ItemCard
            key={item.id}
            item={item}
            onRemove={onRemove}
            onToggle={onToggle}
            onItemDragStart={onItemDragStart}
          />
        ))}
        <div className="py-[10px] text-center text-xs text-n500">
          ツリーからここへドラッグでコピー
        </div>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  carryFrom,
  onRemove,
  onToggle,
  onItemDragStart,
}: {
  item: ViewListItem;
  /** 持ち越し元の日付(未完了セクションでのみ表示) */
  carryFrom?: string;
  onRemove: (item: ListItem) => void;
  onToggle: (item: ViewListItem) => void;
  onItemDragStart: (item: ListItem) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.title);
        e.dataTransfer.effectAllowed = "move";
        onItemDragStart(item);
      }}
      className="mb-[10px] flex cursor-grab items-start gap-[10px] rounded-2xl border border-n400 bg-white px-3 py-[10px] shadow-card"
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-label={item.effChecked ? "未完了に戻す" : "完了にする"}
        className={`mt-[3px] flex h-[15px] w-[15px] flex-none cursor-pointer items-center justify-center rounded-full border-[1.5px] ${
          item.effChecked
            ? "border-n800 bg-n800 text-[9px] leading-none text-white"
            : "border-n400 bg-transparent"
        }`}
      >
        {item.effChecked ? "✓" : ""}
      </button>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[15px] leading-[1.25] font-bold ${
            item.effChecked ? "text-n500 line-through" : "text-n900"
          }`}
        >
          {item.title}
        </span>
        <span className="mt-[5px] flex items-center gap-[6px]">
          <span className="truncate text-[11.5px] text-n600">{item.path}</span>
          {carryFrom && (
            <span className="text-[11px] whitespace-nowrap text-overdue">
              {formatMD(carryFrom)}から
            </span>
          )}
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
  );
}
