"use client";

import type { CSSProperties, DragEvent } from "react";
import {
  formatMD,
  formatMDW,
  formatTimeRange,
  isMeetingEnded,
  nowHM,
  todayIso,
} from "@/lib/date";
import {
  NODE_W,
  NOTE_GAP,
  NOTE_LINE_H,
  NOTE_MAX_LINES,
  NOTE_W,
  noteLineCount,
  type PlacedNode,
} from "@/lib/tree";
import type { DragPayload, TreeNode } from "@/lib/types";
import { DuePill, MeetingChip, NextChip, StatusChip } from "./pills";

interface NodeCardProps {
  rec: PlacedNode;
  collapsed: boolean;
  noteExpanded: boolean;
  onToggle: (id: string) => void;
  onAddChild: (node: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onOpenNote: (node: TreeNode) => void;
  onToggleNote: (id: string) => void;
  onDragStart: (payload: DragPayload) => void;
}

export function NodeCard({
  rec,
  collapsed,
  noteExpanded,
  onToggle,
  onAddChild,
  onEdit,
  onOpenNote,
  onToggleNote,
  onDragStart,
}: NodeCardProps) {
  const n = rec.node;
  const meeting = n.node_type === "meeting";
  // ミーティングの終了はstatusではなく日時から導出(レンダーごとに再計算)
  const ended =
    meeting && isMeetingEnded(n.due_date, n.meet_end, todayIso(), nowHM());
  const done = n.status === "done" && !meeting;
  const active = n.status === "active" && !meeting;
  const hasKids = n.children.length > 0;
  const noteLines = n.note ? noteLineCount(n.note) : 0;
  const noteClamped = noteLines > NOTE_MAX_LINES;
  const inactive = done || ended;

  const box: CSSProperties = {
    position: "absolute",
    left: rec.x,
    top: rec.y,
    width: NODE_W,
    height: rec.h,
    borderRadius: 16,
    ...(inactive
      ? {
          padding: meeting ? "10px 16px" : "12px 16px",
          border: "1px solid var(--color-n300)",
          background: "var(--color-n200)",
        }
      : meeting
        ? {
            padding: "10px 16px",
            border: "1px solid var(--color-accent)",
            background: "var(--color-accent-100)",
            boxShadow: "var(--shadow-card)",
            cursor: "grab",
          }
        : active
          ? {
              padding: "9px 16px",
              border: "2px solid var(--color-accent)",
              background: "#ffffff",
              boxShadow: "var(--shadow-card)",
              cursor: "grab",
            }
          : {
              padding: "10px 16px",
              border: "1px solid var(--color-n400)",
              background: "#ffffff",
              boxShadow: "var(--shadow-card)",
              cursor: "grab",
            }),
  };

  const handleDragStart = (e: DragEvent) => {
    if (inactive) return;
    e.dataTransfer.setData("text/plain", n.title);
    e.dataTransfer.effectAllowed = "copy";
    onDragStart({
      kind: "node",
      title: n.title,
      path: rec.path,
      due_date: n.due_date,
      node_id: n.id,
    });
  };

  // 2行目のメタ表示: 完了日 / 期限バッジ / 「未着手」(ミーティングでは使わない)
  let meta: React.ReactNode = null;
  if (meeting) {
    meta = null;
  } else if (done) {
    meta = (
      <span className="text-[11.5px] whitespace-nowrap text-n500">
        完了{n.done_date ? ` ${formatMD(n.done_date)}` : ""}
      </span>
    );
  } else if (n.due_date) {
    meta = <DuePill due={n.due_date} />;
  } else if (!active) {
    meta = <span className="text-[11.5px] whitespace-nowrap text-n500">未着手</span>;
  }

  return (
    <>
      <div
        data-node
        draggable={!inactive}
        onDragStart={handleDragStart}
        onClick={() => onEdit(n)}
        style={box}
      >
        <div
          style={{
            fontSize: rec.depth === 0 ? 18 : 17,
            lineHeight: 1.25,
            fontWeight: done ? 500 : 700,
            color: inactive ? "var(--color-n500)" : "var(--color-n900)",
            textDecoration: done ? "line-through" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {n.title}
          {done && <span style={{ color: "var(--color-accent-700)" }}> ✓</span>}
        </div>
        <div className="mt-[6px] flex items-center gap-[6px]">
          {meeting && <MeetingChip />}
          {meeting && (
            <span
              className={`text-[11.5px] whitespace-nowrap tabular-nums ${
                ended ? "text-n500" : "text-chip-blue"
              }`}
            >
              {n.due_date ? formatMDW(n.due_date) : "日付未定"}
              {formatTimeRange(n.meet_start, n.meet_end) &&
                ` ${formatTimeRange(n.meet_start, n.meet_end)}`}
              {ended && " ・ 終了"}
            </span>
          )}
          {active && <StatusChip />}
          {!meeting && n.next_flag && <NextChip />}
          {meta}
        </div>
        {meeting && n.attendees && (
          <div className="mt-[4px] overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-n600">
            {n.attendees}
          </div>
        )}
        {hasKids && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggle(n.id);
            }}
            className="absolute top-[6px] right-[-13px] h-[26px] w-[26px] cursor-pointer rounded-full bg-n800 text-center text-[14px] leading-[26px] text-white select-none"
          >
            {collapsed ? "+" : "−"}
          </div>
        )}
        {/* ミーティングは子を持てない(単独ミーティングをforestから除外する前提を守る) */}
        {!meeting && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(n);
            }}
            title="子タスクを追加"
            className="absolute right-[-13px] h-[26px] w-[26px] cursor-pointer rounded-full border border-accent bg-white text-center text-[13px] leading-[24px] text-accent-700 select-none hover:bg-accent-100"
            style={{ top: hasKids ? 36 : 19 }}
          >
            ＋
          </div>
        )}
      </div>
      {rec.noteH > 0 && n.note && (
        <div
          data-note
          className="absolute rounded-r-md border-l-2 border-n300 pl-[10px] text-[11.5px] leading-[16px] text-n900 select-none"
          style={{
            left: rec.x + 12,
            top: rec.y + rec.h + NOTE_GAP,
            width: NOTE_W,
            height: rec.noteH - NOTE_GAP,
          }}
        >
          <div
            onClick={() => onOpenNote(n)}
            title="クリックで拡大・編集"
            className="cursor-pointer overflow-hidden break-all whitespace-pre-wrap hover:bg-white"
            style={{
              height:
                (noteClamped && !noteExpanded ? NOTE_MAX_LINES : noteLines) * NOTE_LINE_H,
            }}
          >
            {n.note}
          </div>
          {noteClamped && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleNote(n.id);
              }}
              className="cursor-pointer pt-[4px] text-[11px] leading-[16px] font-bold text-accent-700 hover:text-accent"
            >
              {noteExpanded ? "折りたたむ" : "すべて表示"}
            </div>
          )}
        </div>
      )}
    </>
  );
}
