export type TaskType = "must" | "want";
export type TaskStatus = "active" | "done";
export type Repeat = "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  type: TaskType;
  due_date: string | null;
  flagged: boolean;
  note: string;
  status: TaskStatus;
  repeat: Repeat | null;
  origin_task_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  completed_at: string | null;
  sort_order: number;
  linked_task_id: string | null;
}

export type LinkedTaskRef = Pick<Task, "id" | "status" | "title" | "completed_at">;

export interface SubtaskWithLink extends Subtask {
  linked_task: LinkedTaskRef | null;
}

export interface TaskWithSubtasks extends Task {
  subtasks: SubtaskWithLink[];
  origin: Pick<Task, "id" | "title"> | null;
}

export interface HomeSubtask {
  id: string;
  done: boolean;
  linked_task: { status: TaskStatus } | null;
}

export interface HomeTask extends Task {
  subtasks: HomeSubtask[];
}

/** 参照サブタスクは自分の done を持たず、リンク先タスクの status から導出する */
export function isSubDone(s: {
  done: boolean;
  linked_task?: { status: TaskStatus } | null;
}): boolean {
  return s.linked_task ? s.linked_task.status === "done" : s.done;
}

export function progressOf(
  subs: { done: boolean; linked_task?: { status: TaskStatus } | null }[]
): { done: number; total: number } | null {
  if (subs.length === 0) return null;
  return { done: subs.filter(isSubDone).length, total: subs.length };
}
