import type { HomeTask } from "./types";

export interface Sections {
  overdue: HomeTask[];
  today: HomeTask[];
  flagged: HomeTask[];
  rest: HomeTask[];
}

/**
 * ホームの区分け（要件 4.1）
 * 1. 期限切れ / 2. 今日 / 3. フラグ付き / 4. それ以外（期限が近い順、期限なしは最後）
 * 各区分内は 期限昇順 → must優先 → 作成順。
 */
export function splitSections(tasks: HomeTask[], today: string): Sections {
  const overdue: HomeTask[] = [];
  const todayList: HomeTask[] = [];
  const flagged: HomeTask[] = [];
  const rest: HomeTask[] = [];

  for (const t of tasks) {
    if (t.due_date && t.due_date < today) overdue.push(t);
    else if (t.due_date === today) todayList.push(t);
    else if (t.flagged) flagged.push(t);
    else rest.push(t);
  }

  const dueKey = (t: HomeTask) => t.due_date ?? "9999-12-31";
  const typeRank = (t: HomeTask) => (t.type === "must" ? 0 : 1);
  const cmp = (a: HomeTask, b: HomeTask) =>
    dueKey(a).localeCompare(dueKey(b)) ||
    typeRank(a) - typeRank(b) ||
    a.created_at.localeCompare(b.created_at);

  overdue.sort(cmp);
  todayList.sort(cmp);
  flagged.sort(cmp);
  rest.sort(cmp);

  return { overdue, today: todayList, flagged, rest };
}
