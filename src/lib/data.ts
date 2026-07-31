import { createClient } from "@/lib/supabase/client";
import { todayStr } from "./date";
import type {
  HomeTask,
  Repeat,
  Subtask,
  Task,
  TaskType,
  TaskWithSubtasks,
} from "./types";

// subtasks は tasks への FK を2本持つ（task_id / linked_task_id）ため、
// 埋め込みには必ずカラム名ヒントを付ける
const HOME_SELECT =
  "*, subtasks!task_id(id,done,linked_task:tasks!linked_task_id(status))";
const DETAIL_SELECT =
  "*, subtasks!task_id(*,linked_task:tasks!linked_task_id(id,status,title,completed_at)), origin:tasks!origin_task_id(id,title)";

export async function fetchActiveTasks(): Promise<HomeTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(HOME_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as HomeTask[];
}

export async function fetchDoneTasks(): Promise<Task[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return data as Task[];
}

export async function fetchTask(id: string): Promise<TaskWithSubtasks | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as TaskWithSubtasks | null;
}

export async function createTask(input: {
  title: string;
  type: TaskType;
  due_date?: string | null;
}): Promise<Task> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    type: TaskType;
    due_date: string | null;
    flagged: boolean;
    note: string;
    status: "active" | "done";
    repeat: Repeat | null;
    completed_at: string | null;
  }>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

/** 完了処理。repeat 付きなら次回分の生成までDB関数内で1トランザクションで行う */
export async function completeTask(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("complete_task", {
    p_task_id: id,
    p_today: todayStr(),
  });
  if (error) throw error;
}

export async function reopenTask(id: string): Promise<void> {
  await updateTask(id, { status: "active", completed_at: null });
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function addSubtask(
  taskId: string,
  title: string,
  sortOrder: number
): Promise<Subtask> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ task_id: taskId, title, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data as Subtask;
}

export async function updateSubtask(
  id: string,
  patch: Partial<Pick<Subtask, "title" | "done" | "completed_at" | "sort_order">>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("subtasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSubtask(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("subtasks").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSubtasks(
  items: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = createClient();
  const results = await Promise.all(
    items.map((i) =>
      supabase.from("subtasks").update({ sort_order: i.sort_order }).eq("id", i.id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/** サブタスクの昇格。新タスク作成とリンク設定をDB関数内で1トランザクションで行う */
export async function promoteSubtask(id: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("promote_subtask", {
    p_subtask_id: id,
  });
  if (error) throw error;
  return data as string;
}
