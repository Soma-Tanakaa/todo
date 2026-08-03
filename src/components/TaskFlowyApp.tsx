"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { DoLists } from "@/components/DoLists";
import { Header } from "@/components/Header";
import { RootSidebar } from "@/components/RootSidebar";
import { TaskDialog, type DialogState, type SavePatch } from "@/components/TaskDialog";
import { TreeSection } from "@/components/TreeSection";
import type { DataSource } from "@/lib/data";
import { todayIso } from "@/lib/date";
import { toast } from "@/lib/toast";
import { buildForest, subtreeIds } from "@/lib/tree";
import type {
  DragPayload,
  ListItem,
  ListName,
  NodeRow,
  TreeNode,
} from "@/lib/types";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;

const FULL_ENTER_ICON =
  "M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3";
const FULL_EXIT_ICON =
  "M8 3v3a2 2 0 0 1-2 2H3 M21 8h-3a2 2 0 0 1-2-2V3 M3 16h3a2 2 0 0 1 2 2v3 M16 21v-3a2 2 0 0 1 2-2h3";

export function TaskFlowyApp({ db }: { db: DataSource }) {
  const [rows, setRows] = useState<NodeRow[] | null>(null);
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState(1);
  const [full, setFull] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const dialogRef = useRef(dialog);
  dialogRef.current = dialog;
  const dragRef = useRef<DragPayload | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // 初期ロード(データ + 端末ローカルのUI状態)
  useEffect(() => {
    Promise.all([db.fetchNodes(), db.fetchListItems()])
      .then(([n, i]) => {
        setRows(n);
        setItems(i);
      })
      .catch(() => toast("読み込みに失敗しました"));
    try {
      const c = localStorage.getItem("tf-collapsed");
      if (c) setCollapsed(JSON.parse(c));
      const z = Number(localStorage.getItem("tf-zoom"));
      if (z >= ZOOM_MIN && z <= ZOOM_MAX) setZoom(z);
    } catch {
      // localStorage不可の環境では既定値のまま
    }
  }, [db]);

  useEffect(() => {
    try {
      localStorage.setItem("tf-collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);
  useEffect(() => {
    try {
      localStorage.setItem("tf-zoom", String(zoom));
    } catch {}
  }, [zoom]);

  // Esc: ダイアログ → 全画面 の順に閉じる
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dialogRef.current) setDialog(null);
      else setFull(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // トラックパッドのピンチはctrl+wheelで届く。preventDefaultするためpassive:false必須
  const attachCanvas = useCallback((el: HTMLDivElement | null) => {
    canvasRef.current = el;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) =>
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * Math.exp(-e.deltaY * 0.012)))
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      canvasRef.current = null;
    };
  }, []);

  const forest = useMemo(() => (rows ? buildForest(rows) : []), [rows]);

  const refresh = () => {
    db.fetchNodes().then(setRows).catch(() => {});
    db.fetchListItems().then(setItems).catch(() => {});
  };
  const fail = (msg: string) => {
    toast(msg);
    refresh();
  };

  const stepZoom = (dz: number) =>
    setZoom((z) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + dz) * 10) / 10))
    );

  const goToTree = (id: string) => {
    const el = document.getElementById(`tree-${id}`);
    const c = canvasRef.current;
    if (el && c) {
      c.scrollTo({
        top:
          el.getBoundingClientRect().top -
          c.getBoundingClientRect().top +
          c.scrollTop -
          12,
        behavior: "smooth",
      });
    }
  };

  const openAddChild = (node: TreeNode) =>
    setDialog({ mode: "add", parentId: node.id, parentTitle: node.title });
  const openAddRoot = () =>
    setDialog({ mode: "add", parentId: null, parentTitle: null });
  const openEdit = (node: TreeNode) => {
    const { children: _children, ...row } = node;
    setDialog({ mode: "edit", node: row });
  };

  const handleCreate = ({
    parentId,
    title,
    due,
  }: {
    parentId: string | null;
    title: string;
    due: string | null;
  }) => {
    setDialog(null);
    const siblings = (rows ?? []).filter((r) => r.parent_id === parentId);
    const sort = siblings.length
      ? Math.max(...siblings.map((s) => s.sort_order)) + 1
      : 0;
    // 親が折りたたみ中なら展開する
    if (parentId) setCollapsed((c) => ({ ...c, [parentId]: false }));
    db.createNode({ parent_id: parentId, title, due_date: due, sort_order: sort })
      .then((row) => setRows((s) => [...(s ?? []), row]))
      .catch(() => fail("追加に失敗しました"));
  };

  const handleSave = (id: string, patch: SavePatch) => {
    setDialog(null);
    const prev = rows?.find((r) => r.id === id);
    const applied = {
      ...patch,
      next_flag: patch.status === "done" ? false : patch.next_flag,
      done_date:
        patch.status === "done" ? (prev?.done_date ?? todayIso()) : null,
    };
    setRows((s) => s?.map((r) => (r.id === id ? { ...r, ...applied } : r)) ?? s);
    db.updateNode(id, applied).catch(() => fail("保存に失敗しました"));
  };

  const handleDelete = (id: string) => {
    setDialog(null);
    if (!rows) return;
    const ids = subtreeIds(rows, id);
    setRows((s) => s?.filter((r) => !ids.has(r.id)) ?? s);
    db.deleteNode(id).catch(() => fail("削除に失敗しました"));
  };

  const handleDrop = (list: ListName, e: DragEvent) => {
    e.preventDefault();
    const it = dragRef.current;
    dragRef.current = null;
    if (!it || !items) return;
    // 同一タスク(タイトル+パス)の重複追加は無視
    if (
      items.some(
        (x) => x.list === list && x.title === it.title && x.path === it.path
      )
    ) {
      return;
    }
    const temp: ListItem = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: "",
      list,
      title: it.title,
      path: it.path,
      due_date: it.due_date,
      node_id: it.node_id,
      checked: false,
      created_at: new Date().toISOString(),
    };
    setItems((s) => [...(s ?? []), temp]);
    db.createListItem({
      list,
      title: it.title,
      path: it.path,
      due_date: it.due_date,
      node_id: it.node_id,
    })
      .then((row) =>
        setItems((s) => s?.map((x) => (x.id === temp.id ? row : x)) ?? s)
      )
      .catch(() => fail("追加に失敗しました"));
  };

  const handleToggleItem = (item: ListItem) => {
    setItems(
      (s) =>
        s?.map((x) => (x.id === item.id ? { ...x, checked: !x.checked } : x)) ??
        s
    );
    if (!item.id.startsWith("temp-")) {
      db.updateListItem(item.id, { checked: !item.checked }).catch(() =>
        fail("更新に失敗しました")
      );
    }
  };

  const handleRemoveItem = (item: ListItem) => {
    setItems((s) => s?.filter((x) => x.id !== item.id) ?? s);
    if (!item.id.startsWith("temp-")) {
      db.deleteListItem(item.id).catch(() => fail("削除に失敗しました"));
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <div className="flex min-h-0 flex-1 items-stretch">
        <RootSidebar roots={forest} onGo={goToTree} onAddRoot={openAddRoot} />

        <div
          ref={attachCanvas}
          className={
            full
              ? "fixed inset-0 z-50 overflow-auto bg-n100 p-[20px_32px_28px]"
              : "relative flex-1 overflow-auto bg-n100 p-[20px_32px_28px]"
          }
        >
          <div className="sticky top-0 left-0 z-10 mb-2 flex justify-end gap-[10px]">
            <div
              onClick={() => setFull((f) => !f)}
              className="inline-flex cursor-pointer items-center gap-[7px] rounded-xl border border-n400 bg-white px-3 py-1 text-xs text-n700 select-none hover:bg-accent-100"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={full ? FULL_EXIT_ICON : FULL_ENTER_ICON} />
              </svg>
              {full ? "全画面を終了" : "全画面"}
            </div>
            <div className="inline-flex items-center rounded-xl border border-n400 bg-white">
              <span
                onClick={() => stepZoom(-0.1)}
                className="cursor-pointer border-r border-divider px-3 py-1 text-[15px] leading-none select-none hover:bg-accent-100"
              >
                −
              </span>
              <span
                onClick={() => setZoom(1)}
                className="min-w-[38px] cursor-pointer px-[10px] py-1 text-center text-xs text-n600 tabular-nums select-none hover:bg-accent-100"
              >
                {Math.round(zoom * 100)}%
              </span>
              <span
                onClick={() => stepZoom(0.1)}
                className="cursor-pointer border-l border-divider px-3 py-1 text-[15px] leading-none select-none hover:bg-accent-100"
              >
                +
              </span>
            </div>
          </div>

          <div style={{ zoom }}>
            {rows === null ? (
              <div className="py-16 text-center text-[13px] text-n500">
                読み込み中…
              </div>
            ) : forest.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-n500">
                まだタスクがありません。左の「＋ 根タスクを追加」から始めましょう。
              </div>
            ) : (
              forest.map((tree) => (
                <TreeSection
                  key={tree.id}
                  tree={tree}
                  collapsed={collapsed}
                  onToggle={(id) =>
                    setCollapsed((c) => ({ ...c, [id]: !c[id] }))
                  }
                  onAddChild={openAddChild}
                  onEdit={openEdit}
                  onDragStart={(p) => {
                    dragRef.current = p;
                  }}
                />
              ))
            )}
          </div>
        </div>

        <DoLists
          items={items ?? []}
          onDrop={handleDrop}
          onRemove={handleRemoveItem}
          onToggle={handleToggleItem}
        />
      </div>

      {dialog && (
        <TaskDialog
          key={
            dialog.mode === "edit"
              ? `e-${dialog.node.id}`
              : `a-${dialog.parentId ?? "root"}`
          }
          state={dialog}
          onClose={() => setDialog(null)}
          onCreate={handleCreate}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
