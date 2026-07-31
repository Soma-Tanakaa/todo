"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import {
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FormEvent,
} from "react";
import { formatTs } from "@/lib/date";
import type { SubtaskWithLink } from "@/lib/types";
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconDots,
  IconDrag,
  IconPlus,
} from "./icons";

interface Callbacks {
  onToggle: (s: SubtaskWithLink) => void;
  onRename: (s: SubtaskWithLink, title: string) => void;
  onDelete: (s: SubtaskWithLink) => void;
  onPromote: (s: SubtaskWithLink) => void;
}

export function SubtaskList({
  items,
  doneItems,
  showDone,
  onToggleShowDone,
  onAdd,
  onReorder,
  ...callbacks
}: {
  /** 未完了サブタスク（sort_order 順） */
  items: SubtaskWithLink[];
  /** 完了済みサブタスク（完了日順） */
  doneItems: SubtaskWithLink[];
  showDone: boolean;
  onToggleShowDone: () => void;
  onAdd: (title: string) => void;
  onReorder: (ordered: SubtaskWithLink[]) => void;
} & Callbacks) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [title, setTitle] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    onAdd(v);
    setTitle("");
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {items.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y divide-gray-100">
              {items.map((s) => (
                <SortableSubtaskRow key={s.id} sub={s} isDone={false} {...callbacks} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <form
        onSubmit={submit}
        className={`flex items-center gap-1 pl-1 ${
          items.length > 0 ? "border-t border-gray-100" : ""
        }`}
      >
        <span className="flex w-8 shrink-0 justify-center text-gray-400">
          <IconPlus size={15} />
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="サブタスクを追加"
          enterKeyHint="done"
          className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none placeholder:text-gray-400"
        />
      </form>
      {doneItems.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={onToggleShowDone}
            className="flex w-full items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-500 active:bg-gray-50"
          >
            {showDone ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
            完了済み {doneItems.length}件
          </button>
          {showDone && (
            <ul className="divide-y divide-gray-100 border-t border-gray-100">
              {doneItems.map((s) => (
                <SubtaskRowInner key={s.id} sub={s} isDone {...callbacks} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

type RowProps = { sub: SubtaskWithLink; isDone: boolean } & Callbacks;

function SortableSubtaskRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.sub.id });
  return (
    <SubtaskRowInner
      {...props}
      containerRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      isDragging={isDragging}
      handleProps={
        { ...attributes, ...listeners } as unknown as ButtonHTMLAttributes<HTMLButtonElement>
      }
    />
  );
}

function SubtaskRowInner({
  sub,
  isDone,
  onToggle,
  onRename,
  onDelete,
  onPromote,
  containerRef,
  style,
  isDragging,
  handleProps,
}: RowProps & {
  containerRef?: (el: HTMLElement | null) => void;
  style?: CSSProperties;
  isDragging?: boolean;
  handleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sub.title);

  const linked = sub.linked_task_id !== null && sub.linked_task !== null;
  const dateSrc = linked ? sub.linked_task!.completed_at : sub.completed_at;
  const dateStr = isDone && dateSrc ? formatTs(dateSrc) : null;
  const titleCls = isDone
    ? "min-w-0 flex-1 truncate text-sm text-gray-400 line-through"
    : "min-w-0 flex-1 truncate text-[15px]";

  const menuItems: { label: string; danger?: boolean; onClick: () => void }[] = [];
  if (linked) {
    menuItems.push({
      label: "リンク先を開く",
      onClick: () => router.push(`/task/${sub.linked_task!.id}`),
    });
  } else if (!isDone) {
    menuItems.push({ label: "タスクに昇格", onClick: () => onPromote(sub) });
  }
  menuItems.push({ label: "削除", danger: true, onClick: () => onDelete(sub) });

  return (
    <li
      ref={containerRef}
      style={style}
      className={`flex items-center bg-white pl-1 ${
        isDragging ? "relative z-10 shadow-md" : ""
      }`}
    >
      {handleProps ? (
        <button
          {...handleProps}
          aria-label="並び替え"
          className="flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-gray-300"
        >
          <IconDrag size={14} />
        </button>
      ) : (
        <span className="w-8 shrink-0" />
      )}
      {linked ? (
        // 参照サブタスク: 手動チェック不可。タップでリンク先の詳細へ
        <button
          onClick={() => router.push(`/task/${sub.linked_task!.id}`)}
          className="flex h-11 min-w-0 flex-1 items-center gap-2 pr-1 text-left active:bg-gray-50"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              isDone
                ? "bg-gray-300 text-white"
                : "border border-gray-300 text-gray-400"
            }`}
          >
            {isDone ? (
              <IconCheck size={11} strokeWidth={3} />
            ) : (
              <IconArrowUpRight size={11} />
            )}
          </span>
          <span className={titleCls}>{sub.title}</span>
        </button>
      ) : (
        <>
          <button
            aria-label={sub.done ? "チェックを外す" : "チェックする"}
            onClick={() => onToggle(sub)}
            className="flex h-11 w-7 shrink-0 items-center justify-center"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                sub.done ? "bg-gray-300 text-white" : "border-2 border-gray-300"
              }`}
            >
              {sub.done && <IconCheck size={11} strokeWidth={3} />}
            </span>
          </button>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                setEditing(false);
                const v = draft.trim();
                if (v && v !== sub.title) onRename(sub, v);
                else setDraft(sub.title);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
            />
          ) : (
            <button
              onClick={() => {
                if (!isDone) {
                  setDraft(sub.title);
                  setEditing(true);
                }
              }}
              className={`flex h-11 min-w-0 flex-1 items-center pr-1 text-left ${
                isDone ? "cursor-default" : ""
              }`}
            >
              <span className={titleCls}>{sub.title}</span>
            </button>
          )}
        </>
      )}
      {dateStr && (
        <span className="shrink-0 pr-1 text-[11px] text-gray-400">{dateStr}</span>
      )}
      <SubMenu items={menuItems} />
    </li>
  );
}

function SubMenu({
  items,
}: {
  items: { label: string; danger?: boolean; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        aria-label="メニュー"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-9 items-center justify-center text-gray-400 active:bg-gray-50"
      >
        <IconDots size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-10 right-1 z-40 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {items.map((i) => (
              <button
                key={i.label}
                onClick={() => {
                  setOpen(false);
                  i.onClick();
                }}
                className={`block w-full px-3 py-2.5 text-left text-sm active:bg-gray-50 ${
                  i.danger ? "text-red-600" : ""
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
