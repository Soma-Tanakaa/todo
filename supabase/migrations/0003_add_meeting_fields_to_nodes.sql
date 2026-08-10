-- ミーティング(オンライン会議)をノードの一種として扱うための列を追加。
-- node_type='meeting' のノードは日付(due_dateを流用)+開始/終了時刻+参加者+URLを持つ。
-- 終了した会議は一覧タブに出さないだけでデータは残す(削除しない)。
alter table public.nodes
  add column if not exists node_type text not null default 'task'
    check (node_type in ('task', 'meeting')),
  add column if not exists meet_start time,
  add column if not exists meet_end time,
  add column if not exists attendees text,
  add column if not exists meeting_url text;
