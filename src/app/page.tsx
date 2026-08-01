"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconPlus } from "@/components/icons";
import { TaskRow } from "@/components/TaskRow";
import { TypeSegment } from "@/components/TypeSegment";
import { cacheGet, cacheSet, HOME_CACHE_KEY, taskCacheKey } from "@/lib/cache";
import { completeTask, createTask, fetchActiveTasks } from "@/lib/data";
import { todayStr } from "@/lib/date";
import { splitSections } from "@/lib/sections";
import { toast } from "@/lib/toast";
import { isSubDone, type HomeTask, type TaskType } from "@/lib/types";

export default function HomePage() {
  const [tasks, setTasks] = useState<HomeTask[] | null>(() =>
    cacheGet<HomeTask[]>(HOME_CACHE_KEY)
  );
  const [confirming, setConfirming] = useState<HomeTask | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchActiveTasks();
      setTasks(data);
      // タップした瞬間に詳細画面を出せるよう、各タスクの詳細キャッシュを温める
      for (const t of data) cacheSet(taskCacheKey(t.id), t);
    } catch {
      toast("読み込みに失敗しました");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tasks) cacheSet(HOME_CACHE_KEY, tasks);
  }, [tasks]);

  const sections = useMemo(
    () => (tasks ? splitSections(tasks, todayStr()) : null),
    [tasks]
  );

  const doComplete = async (t: HomeTask) => {
    setConfirming(null);
    setTasks((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev));
    try {
      await completeTask(t.id);
    } catch {
      toast("完了にできませんでした");
    }
    load();
  };

  const requestComplete = (t: HomeTask) => {
    const remaining = t.subtasks.filter((s) => !isSubDone(s)).length;
    if (remaining > 0) setConfirming(t);
    else doComplete(t);
  };

  const handleAdd = async (title: string, type: TaskType) => {
    try {
      await createTask({ title, type });
      load();
    } catch {
      toast("追加できませんでした");
    }
  };

  const remainingCount = confirming
    ? confirming.subtasks.filter((s) => !isSubDone(s)).length
    : 0;

  return (
    <>
      <AppHeader
        title="進捗帖"
        right={
          <Link
            href="/done"
            className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-gray-500 active:bg-gray-100"
          >
            完了リスト
          </Link>
        }
      />
      <main className="pb-36">
        {!sections ? (
          <p className="p-10 text-center text-sm text-gray-400">読み込み中...</p>
        ) : tasks && tasks.length === 0 ? (
          <p className="px-8 py-20 text-center text-sm text-gray-400">
            タスクはありません。
            <br />
            下の入力欄から追加できます。
          </p>
        ) : (
          <>
            <Section
              label="期限切れ"
              labelClass="text-overdue"
              tasks={sections.overdue}
              overdue
              onComplete={requestComplete}
            />
            <Section label="今日" tasks={sections.today} onComplete={requestComplete} />
            <Section
              label="フラグ付き"
              tasks={sections.flagged}
              onComplete={requestComplete}
            />
            <Section
              label="それ以外"
              tasks={sections.rest}
              onComplete={requestComplete}
            />
          </>
        )}
      </main>
      <QuickAdd onAdd={handleAdd} />
      <ConfirmDialog
        open={confirming !== null}
        title="タスクを完了にしますか？"
        message={`未完了のサブタスクが${remainingCount}件あります。\n残りは未チェックのまま保存されます。`}
        okLabel="完了にする"
        onOk={() => confirming && doComplete(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}

function Section({
  label,
  labelClass,
  tasks,
  overdue,
  onComplete,
}: {
  label: string;
  labelClass?: string;
  tasks: HomeTask[];
  overdue?: boolean;
  onComplete: (t: HomeTask) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2
        className={`px-4 pt-4 pb-1 text-xs font-bold ${labelClass ?? "text-gray-500"}`}
      >
        {label}
        <span className="ml-1.5 font-normal text-gray-400">{tasks.length}</span>
      </h2>
      <ul className="border-t border-gray-100">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} overdue={overdue} onComplete={onComplete} />
        ))}
      </ul>
    </section>
  );
}

function QuickAdd({
  onAdd,
}: {
  onAdd: (title: string, type: TaskType) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("must");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = title.trim();
    if (!v) return;
    onAdd(v, type);
    setTitle("");
  };

  return (
    <form
      onSubmit={submit}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2 p-2.5">
        <TypeSegment value={type} onChange={setType} compact />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスクを追加"
          enterKeyHint="done"
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-base outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          aria-label="追加"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white active:opacity-80 disabled:opacity-30"
        >
          <IconPlus size={18} />
        </button>
      </div>
    </form>
  );
}
