export type NodeStatus = "todo" | "active" | "done";
export type ListName = "today" | "later";

/** nodes テーブルの1行(ツリーのノード) */
export interface NodeRow {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  due_date: string | null; // YYYY-MM-DD
  status: NodeStatus;
  next_flag: boolean;
  done_date: string | null; // YYYY-MM-DD
  sort_order: number;
  created_at: string;
}

/** list_items テーブルの1行(今日やる/明日以降やる のコピー) */
export interface ListItem {
  id: string;
  user_id: string;
  list: ListName;
  title: string;
  path: string;
  due_date: string | null;
  node_id: string | null;
  checked: boolean;
  created_at: string;
}

/** 子を展開済みのツリーノード */
export interface TreeNode extends NodeRow {
  children: TreeNode[];
}

/** ツリー→リストへのD&Dで運ぶデータ */
export interface DragPayload {
  title: string;
  path: string;
  due_date: string | null;
  node_id: string;
}
