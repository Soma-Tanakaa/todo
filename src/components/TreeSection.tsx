"use client";

import { useMemo } from "react";
import { formatMD } from "@/lib/date";
import { layoutTree } from "@/lib/tree";
import type { DragPayload, TreeNode } from "@/lib/types";
import { NodeCard } from "./NodeCard";

interface TreeSectionProps {
  tree: TreeNode;
  collapsed: Record<string, boolean>;
  onToggle: (id: string) => void;
  onAddChild: (node: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onOpenNote: (node: TreeNode) => void;
  onDragStart: (payload: DragPayload) => void;
}

export function TreeSection({
  tree,
  collapsed,
  onToggle,
  onAddChild,
  onEdit,
  onOpenNote,
  onDragStart,
}: TreeSectionProps) {
  const layout = useMemo(() => layoutTree(tree, collapsed), [tree, collapsed]);

  return (
    <div id={`tree-${tree.id}`} className="mb-6 border-b border-divider pb-6">
      <div className="flex items-baseline gap-4">
        <span className="text-xs tracking-[3px] text-n600">
          {tree.title}
          {tree.due_date ? ` ─ 期限 ${formatMD(tree.due_date)}` : ""}
        </span>
        <span
          onClick={() => onAddChild(tree)}
          className="cursor-pointer text-xs text-accent-700 hover:text-accent"
        >
          ＋ タスク追加
        </span>
      </div>
      <div
        className="relative mt-1"
        style={{ width: layout.width, height: layout.height }}
      >
        <svg
          width={layout.width}
          height={layout.height}
          className="pointer-events-none absolute inset-0"
        >
          {layout.connectors.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="var(--color-n500)" strokeWidth={1.5} />
          ))}
        </svg>
        {layout.placed.map((rec) => (
          <NodeCard
            key={rec.node.id}
            rec={rec}
            collapsed={!!collapsed[rec.node.id]}
            onToggle={onToggle}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onOpenNote={onOpenNote}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}
