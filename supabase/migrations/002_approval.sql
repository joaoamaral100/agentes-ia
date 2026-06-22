-- ============================================================
-- Migration 002: user approval system
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Add approval columns to profiles
alter table public.profiles
  add column if not exists approved boolean not null default false,
  add column if not exists is_admin boolean not null default false;

-- Security-definer helper prevents RLS recursion when policies
-- need to check the caller's own is_admin flag
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Admins can read every profile
create policy "profiles: admin select all"
  on public.profiles for select
  using (public.is_admin());

-- Admins can approve / reject any profile
create policy "profiles: admin update all"
  on public.profiles for update
  using (public.is_admin());

-- Re-create the trigger function so new signups get explicit defaults
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, approved, is_admin)
  values (new.id, new.email, false, false)
  on conflict (id) do nothing;
  return new;
end;
$$;
