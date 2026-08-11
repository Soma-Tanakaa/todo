-- 勤務時間タイマー: 開始〜停止の区間を記録する。
-- 稼働中の区間は ended_at が null。経過時間は常に「現在時刻 - started_at」で導出するため、
-- PCのスリープ/シャットダウンやブラウザ終了をまたいでも実時間で進み続ける。
create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz check (ended_at is null or ended_at >= started_at),
  created_at timestamptz not null default now()
);

create index work_sessions_user_started_idx on public.work_sessions (user_id, started_at desc);
-- 稼働中のセッションはユーザーごとに1つまで(二重スタート防止)
create unique index work_sessions_one_running_idx on public.work_sessions (user_id)
  where ended_at is null;

alter table public.work_sessions enable row level security;

create policy "own_work_sessions" on public.work_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
