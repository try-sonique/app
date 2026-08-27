-- Run once in Supabase → SQL Editor
-- Saves Aria feedback with the account (not only this phone/browser)

create table if not exists public.practice_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  piece_name text,
  has_partition boolean,
  created_at timestamptz not null default now(),
  feedback_headline text,
  take_number int,
  feedback jsonb,
  has_audio boolean
);

create index if not exists practice_sessions_email_idx on public.practice_sessions (email);

alter table public.practice_sessions enable row level security;

drop policy if exists "Users can read own sessions" on public.practice_sessions;
drop policy if exists "Users can insert own sessions" on public.practice_sessions;
drop policy if exists "Users can update own sessions" on public.practice_sessions;

create policy "Users can read own sessions"
  on public.practice_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.practice_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.practice_sessions for update
  using (auth.uid() = user_id);
