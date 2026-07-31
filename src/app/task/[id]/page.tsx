"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconCornerUpLeft, IconTrash } from "@/components/icons";
import { SubtaskList } from "@/components/SubtaskList";
import { TypeSegment } from "@/components/TypeSegment";
import {
  addSubtask,
  completeTask,
  deleteSubtask,
  deleteTask,
  fetchTask,
  promoteSubtask,
  reopenTask,
  reorderSubtasks,
  updateSubtask,
  updateTask,
} from "@/lib/data";
import { formatTs } from "@/lib/date";
import { toast } from "@/lib/toast";
import {
  isSubDone,
  progressOf,
  type Repeat,
  type SubtaskWithLink,
  type TaskWithSubtasks,
} from "@/lib/types";

type Confirm =
  | { kind: "complete" }
  | { kind: "deleteTask" }
  | { kind: "deleteSub"; sub: SubtaskWithLink };

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<TaskWithSubtasks | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showDoneSubs, setShowDoneSubs] = useState(true);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const draftsInitRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const t = await fetchTask(id);
      setTask(t);
      if (t && !draftsInitRef.current) {
        setTitleDraft(t.title);
        setNoteDraft(t.note);
        draftsInitRef.current = true;
      }
    } catch {
      toast("読み込みに失敗しました");
    } finally {
      setLoaded(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const activeSubs = useMemo(
    () =>
      task
        ? task.subtasks
            .filter((s) => !isSubDone(s))
            .sort((a, b) => a.sort_order - b.sort_order)
        : [],
    [task]
  );

  const doneSubs = useMemo(() => {
    if (!task) return [];
    const key = (s: SubtaskWithLink) =>
      (s.linked_task ? s.linked_task.completed_at : s.completed_at) ?? "9999";
    return task.subtasks
      .filter((s) => isSubDone(s))
      .sort((a, b) => key(a).localeCompare(key(b)));
  }, [task]);

  const prog = task ? progressOf(task.subtasks) : null;

  const patch = async (p: Parameters<typeof updateTask>[1]) => {
    if (!task) return;
    setTask({ ...task, ...p } as TaskWithSubtasks);
    try {
      await updateTask(task.id, p);
    } catch {
      toast("保存できませんでした");
      load();
    }
  };

  const handleToggleSub = async (s: SubtaskWithLink) => {
    if (!task || s.linked_task_id) return;
    const done = !s.done;
    const completed_at = done ? new Date().toISOString() : null;
    setTask((t) =>
      t && {
        ...t,
        subtasks: t.subtasks.map((x) =>
          x.id === s.id ? { ...x, done, completed_at } : x
        ),
      }
    );
    try {
      await updateSubtask(s.id, { done, completed_at });
    } catch {
      toast("保存できませんでした");
      load();
    }
  };

  const handleAddSub = async (title: string) => {
    if (!task) return;
    const nextOrder =
      task.subtasks.reduce((m, s) => Math.max(m, s.sort_order), -1) + 1;
    try {
      const created = await addSubtask(task.id, title, nextOrder);
      setTask((t) =>
        t && { ...t, subtasks: [...t.subtasks, { ...created, linked_task: null }] }
      );
    } catch {
      toast("追加できませんでした");
    }
  };

  const handleRenameSub = async (s: SubtaskWithLink, title: string) => {
    setTask((t) =>
      t && {
        ...t,
        subtasks: t.subtasks.map((x) => (x.id === s.id ? { ...x, title } : x)),
      }
    );
    try {
      await updateSubtask(s.id, { title });
    } catch {
      toast("保存できませんでした");
      load();
    }
  };

  const handleDeleteSub = async (s: SubtaskWithLink) => {
    setConfirm(null);
    setTask((t) =>
      t && { ...t, subtasks: t.subtasks.filter((x) => x.id !== s.id) }
    );
    try {
      await deleteSubtask(s.id);
    } catch {
      toast("削除できませんでした");
      load();
    }
  };

  const handlePromote = async (s: SubtaskWithLink) => {
    try {
      await promoteSubtask(s.id);
      toast("タスクに昇格しました");
      await load();
    } catch {
      toast("昇格できませんでした");
    }
  };

  const handleReorder = async (ordered: SubtaskWithLink[]) => {
    if (!task) return;
    const orderMap = new Map(ordered.map((s, i) => [s.id, i]));
    setTask((t) =>
      t && {
        ...t,
        subtasks: t.subtasks.map((s) =>
          orderMap.has(s.id) ? { ...s, sort_order: orderMap.get(s.id)! } : s
        ),
      }
    );
    try {
      await reorderSubtasks(ordered.map((s, i) => ({ id: s.id, sort_order: i })));
    } catch {
      toast("並び替えを保存できませんでした");
      load();
    }
  };

  const requestComplete = () => {
    if (activeSubs.length > 0) setConfirm({ kind: "complete" });
    else doComplete();
  };

  const doComplete = async () => {
    if (!task) return;
    setConfirm(null);
    try {
      await completeTask(task.id);
      router.push("/");
    } catch {
      toast("完了にできませんでした");
    }
  };

  const handleReopen = async () => {
    if (!task) return;
    try {
      await reopenTask(task.id);
      load();
    } catch {
      toast("戻せませんでした");
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    setConfirm(null);
    try {
      await deleteTask(task.id);
      router.push("/");
    } catch {
      toast("削除できませんでした");
    }
  };

  if (!loaded) {
    return (
      <>
        <AppHeader back title="" />
        <p className="p-10 text-center text-sm text-gray-400">読み込み中...</p>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <AppHeader back title="" />
        <p className="p-10 text-center text-sm text-gray-400">
          タスクが見つかりません
        </p>
      </>
    );
  }

  const confirmProps =
    confirm?.kind === "complete"
      ? {
          title: "タスクを完了にしますか？",
          message: `未完了のサブタスクが${activeSubs.length}件あります。\n残りは未チェックのまま保存されます。`,
          okLabel: "完了にする",
          danger: false,
          onOk: doComplete,
        }
      : confirm?.kind === "deleteTask"
        ? {
            title: "タスクを削除しますか？",
            message: "サブタスクも一緒に削除されます。この操作は元に戻せません。",
            okLabel: "削除",
            danger: true,
            onOk: handleDeleteTask,
          }
        : confirm?.kind === "deleteSub"
          ? {
              title: "サブタスクを削除しますか？",
              message: `「${confirm.sub.title}」を削除します。`,
              okLabel: "削除",
              danger: true,
              onOk: () => handleDeleteSub(confirm.sub),
            }
          : null;

  return (
    <>
      <AppHeader
        back
        title=""
        right={
          <button
            aria-label="タスクを削除"
            onClick={() => setConfirm({ kind: "deleteTask" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 active:bg-gray-100"
          >
            <IconTrash size={18} />
          </button>
        }
      />
      <main className="px-4 pb-16">
        {task.status === "done" && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
            <span>
              完了済み
              {task.completed_at && ` ・ ${formatTs(task.completed_at)}`}
            </span>
            <button
              onClick={handleReopen}
              className="font-medium text-gray-900 underline underline-offset-2"
            >
              未完了に戻す
            </button>
          </div>
        )}

        {task.origin && (
          <Link
            href={`/task/${task.origin.id}`}
            className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 underline-offset-2 active:underline"
          >
            <IconCornerUpLeft size={12} />
            「{task.origin.title}」から昇格
          </Link>
        )}

        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => {
            const v = titleDraft.trim();
            if (v && v !== task.title) patch({ title: v });
            else setTitleDraft(task.title);
          }}
          placeholder="タイトル"
          className="mt-2 w-full bg-transparent text-xl font-bold outline-none"
        />

        <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200">
          <Row label="種類">
            <TypeSegment value={task.type} onChange={(t) => patch({ type: t })} />
          </Row>
          <Row label="期限">
            <div className="flex items-center gap-1">
              {task.due_date && (
                <button
                  onClick={() => patch({ due_date: null })}
                  className="px-1.5 py-1 text-xs text-gray-400"
                >
                  クリア
                </button>
              )}
              <input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => patch({ due_date: e.target.value || null })}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-base"
              />
            </div>
          </Row>
          <Row label="フラグ">
            <Switch
              checked={task.flagged}
              onChange={(v) => patch({ flagged: v })}
            />
          </Row>
          <Row label="繰り返し">
            <select
              value={task.repeat ?? ""}
              onChange={(e) =>
                patch({ repeat: (e.target.value || null) as Repeat | null })
              }
              className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-base"
            >
              <option value="">なし</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
          </Row>
        </div>

        <section className="mt-5">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-sm font-bold text-gray-700">サブタスク</h2>
            {prog && (
              <span className="text-xs text-gray-500">
                {prog.done}/{prog.total} 完了
              </span>
            )}
          </div>
          <SubtaskList
            items={activeSubs}
            doneItems={doneSubs}
            showDone={showDoneSubs}
            onToggleShowDone={() => setShowDoneSubs((v) => !v)}
            onToggle={handleToggleSub}
            onAdd={handleAddSub}
            onRename={handleRenameSub}
            onDelete={(s) => setConfirm({ kind: "deleteSub", sub: s })}
            onPromote={handlePromote}
            onReorder={handleReorder}
          />
        </section>

        <section className="mt-5">
          <h2 className="px-1 text-sm font-bold text-gray-700">メモ</h2>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => {
              if (noteDraft !== task.note) patch({ note: noteDraft });
            }}
            rows={4}
            placeholder="メモ"
            className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-base outline-none focus:border-gray-400"
          />
        </section>

        {task.status === "active" && (
          <button
            onClick={requestComplete}
            className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-[15px] font-semibold text-white active:opacity-80"
          >
            完了にする
          </button>
        )}
      </main>
      {confirmProps && (
        <ConfirmDialog
          open
          title={confirmProps.title}
          message={confirmProps.message}
          okLabel={confirmProps.okLabel}
          danger={confirmProps.danger}
          onOk={confirmProps.onOk}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between px-3 py-2">
      <span className="shrink-0 text-sm text-gray-600">{label}</span>
      {children}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label="フラグ"
      onClick={() => onChange(!checked)}
      className={`h-7 w-12 rounded-full p-1 transition-colors ${
        checked ? "bg-amber-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
