export type NodeStatus = "todo" | "active" | "done";
export type ListName = "today" | "later";

/** nodes テーブルの1行(ツリーのノード) */
export interface NodeRow {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  due_date: string | null; // YYYY-MM-DD
  note: string | null;
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
  /** リストに載せた端末ローカル日付(YYYY-MM-DD)。今日やるの日跨ぎ判定に使う */
  listed_on: string;
  created_at: string;
}

/** 表示用: リンク先ノードの完了状態を織り込んだチェック状態付き */
export interface ViewListItem extends ListItem {
  effChecked: boolean;
}

/** 子を展開済みのツリーノード */
export interface TreeNode extends NodeRow {
  children: TreeNode[];
}

/** D&Dで運ぶデータ。ツリーのノード(コピー)か、リストカード(ゾーン間移動)のどちらか */
export type DragPayload =
  | {
      kind: "node";
      title: string;
      path: string;
      due_date: string | null;
      node_id: string;
    }
  | { kind: "item"; item: ListItem };
