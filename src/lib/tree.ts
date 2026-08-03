import type { NodeRow, TreeNode } from "./types";

// デザインリファレンス(TaskFlowy.dc.html)のレイアウト定数
export const COL = 306; // 列間隔
export const NODE_W = 250;
export const NODE_H = 70;
export const ROW = 92; // 葉ごとの行送り

/** フラットな行からツリーの森を組み立てる(親なし=根タスク) */
export function buildForest(rows: NodeRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  for (const n of map.values()) {
    const parent = n.parent_id ? map.get(n.parent_id) : undefined;
    if (parent) parent.children.push(n);
    else roots.push(n);
  }
  const bySort = (a: TreeNode, b: TreeNode) =>
    a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);
  map.forEach((n) => n.children.sort(bySort));
  roots.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return roots;
}

export interface PlacedNode {
  node: TreeNode;
  depth: number;
  x: number;
  y: number;
  /** 祖先のパス。根は「ルート」 */
  path: string;
}

export interface TreeLayout {
  placed: PlacedNode[];
  /** 親→子コネクタのSVGパス */
  connectors: string[];
  width: number;
  height: number;
}

/**
 * ツリーレイアウト(デザインリファレンスのアルゴリズムを移植)。
 * 葉(または折りたたみ中)は行カーソル位置に置き、親は最初と最後の子の中間に置く。
 */
export function layoutTree(
  root: TreeNode,
  collapsed: Record<string, boolean>
): TreeLayout {
  const placed: PlacedNode[] = [];
  const connectors: string[] = [];
  let cursor = 10;
  let maxDepth = 0;

  const walk = (node: TreeNode, depth: number, parentPath: string): PlacedNode => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = node.children;
    const open = !collapsed[node.id];
    const rec: PlacedNode = {
      node,
      depth,
      x: 20 + depth * COL,
      y: 0,
      path: parentPath,
    };
    if (!kids.length || !open) {
      rec.y = cursor;
      cursor += ROW;
    } else {
      const childPath =
        parentPath === "ルート" ? node.title : `${parentPath} / ${node.title}`;
      const recs = kids.map((k) => walk(k, depth + 1, childPath));
      rec.y = (recs[0].y + recs[recs.length - 1].y) / 2;
      const sx = rec.x + NODE_W;
      const sy = rec.y + NODE_H / 2;
      for (const c of recs) {
        const ex = 20 + (depth + 1) * COL;
        const ey = c.y + NODE_H / 2;
        connectors.push(
          `M${sx},${sy} C${sx + 36},${sy} ${ex - 36},${ey} ${ex},${ey}`
        );
      }
    }
    placed.push(rec);
    return rec;
  };

  walk(root, 0, "ルート");
  const height = cursor - ROW + NODE_H + 10;
  const width = Math.max(1150, 20 + maxDepth * COL + NODE_W + 20);
  return { placed, connectors, width, height };
}

/** 指定ノードの子孫(自身を含む)のid集合 */
export function subtreeIds(rows: NodeRow[], rootId: string): Set<string> {
  const byParent = new Map<string | null, NodeRow[]>();
  rows.forEach((r) => {
    const list = byParent.get(r.parent_id) ?? [];
    list.push(r);
    byParent.set(r.parent_id, list);
  });
  const ids = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    ids.add(id);
    (byParent.get(id) ?? []).forEach((c) => stack.push(c.id));
  }
  return ids;
}
