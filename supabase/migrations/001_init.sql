-- ============================================================
-- Migration 001: users (profiles) and conversations
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
-- Extends auth.users with display info.
-- A trigger auto-creates a row when someone signs up.
create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text        not null,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- ── conversations ──────────────────────────────────────────
-- One row per (user, agent). Messages stored as JSONB array.
create table if not exists public.conversations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  agent_id   text        not null,
  messages   jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_user_agent unique (user_id, agent_id)
);

alter table public.conversations enable row level security;

create policy "conversations: owner select"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "conversations: owner insert"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "conversations: owner update"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "conversations: owner delete"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();

-- ── auto-create profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
