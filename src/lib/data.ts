import { createClient } from "@/lib/supabase/client";
import type {
  ListItem,
  ListName,
  NodeRow,
  NodeStatus,
  NodeType,
  WorkSession,
} from "./types";

/** アプリが必要とするデータ操作一式。本番はSupabase、/previewはメモリ実装 */
export interface DataSource {
  fetchNodes(): Promise<NodeRow[]>;
  createNode(input: {
    parent_id: string | null;
    title: string;
    due_date: string | null;
    note: string | null;
    sort_order: number;
    node_type?: NodeType;
    meet_start?: string | null;
    meet_end?: string | null;
    attendees?: string | null;
    meeting_url?: string | null;
  }): Promise<NodeRow>;
  updateNode(
    id: string,
    patch: Partial<
      Pick<
        NodeRow,
        | "title"
        | "due_date"
        | "note"
        | "status"
        | "next_flag"
        | "done_date"
        | "sort_order"
        | "parent_id"
        | "meet_start"
        | "meet_end"
        | "attendees"
        | "meeting_url"
      >
    >
  ): Promise<void>;
  deleteNode(id: string): Promise<void>;
  fetchListItems(): Promise<ListItem[]>;
  createListItem(input: {
    list: ListName;
    title: string;
    path: string;
    due_date: string | null;
    node_id: string | null;
    listed_on: string;
  }): Promise<ListItem>;
  updateListItem(
    id: string,
    patch: Partial<Pick<ListItem, "checked" | "list" | "listed_on">>
  ): Promise<void>;
  deleteListItem(id: string): Promise<void>;
  fetchWorkSessions(): Promise<WorkSession[]>;
  startWorkSession(): Promise<WorkSession>;
  stopWorkSession(id: string, endedAt: string): Promise<void>;
}

/** Postgresのtime型は "14:00:00" で返るため、アプリ内表記の "HH:MM" に揃える */
function normalizeTimes(r: NodeRow): NodeRow {
  return {
    ...r,
    meet_start: r.meet_start?.slice(0, 5) ?? null,
    meet_end: r.meet_end?.slice(0, 5) ?? null,
  };
}

export async function fetchNodes(): Promise<NodeRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nodes")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as NodeRow[]).map(normalizeTimes);
}

export async function createNode(input: {
  parent_id: string | null;
  title: string;
  due_date: string | null;
  note: string | null;
  sort_order: number;
  node_type?: NodeType;
  meet_start?: string | null;
  meet_end?: string | null;
  attendees?: string | null;
  meeting_url?: string | null;
}): Promise<NodeRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("nodes")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return normalizeTimes(data as NodeRow);
}

export async function updateNode(
  id: string,
  patch: Partial<{
    title: string;
    due_date: string | null;
    note: string | null;
    status: NodeStatus;
    next_flag: boolean;
    done_date: string | null;
    sort_order: number;
    parent_id: string | null;
    meet_start: string | null;
    meet_end: string | null;
    attendees: string | null;
    meeting_url: string | null;
  }>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("nodes").update(patch).eq("id", id);
  if (error) throw error;
}

/** 子孫はDBのON DELETE CASCADEで一緒に消える */
export async function deleteNode(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("nodes").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchListItems(): Promise<ListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("list_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as ListItem[];
}

export async function createListItem(input: {
  list: ListName;
  title: string;
  path: string;
  due_date: string | null;
  node_id: string | null;
  listed_on: string;
}): Promise<ListItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("list_items")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as ListItem;
}

export async function updateListItem(
  id: string,
  patch: Partial<Pick<ListItem, "checked" | "list" | "listed_on">>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("list_items").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteListItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("list_items").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchWorkSessions(): Promise<WorkSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .order("started_at", { ascending: true });
  if (error) throw error;
  return data as WorkSession[];
}

/** started_at はDB側の now() に任せる(端末の時計ズレの影響を受けない) */
export async function startWorkSession(): Promise<WorkSession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("work_sessions")
    .insert({})
    .select()
    .single();
  if (error) throw error;
  return data as WorkSession;
}

export async function stopWorkSession(id: string, endedAt: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("work_sessions")
    .update({ ended_at: endedAt })
    .eq("id", id);
  if (error) throw error;
}

export const supabaseDb: DataSource = {
  fetchNodes,
  createNode,
  updateNode,
  deleteNode,
  fetchListItems,
  createListItem,
  updateListItem,
  deleteListItem,
  fetchWorkSessions,
  startWorkSession,
  stopWorkSession,
};
