-- PawPlay database schema
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).

create table if not exists public.pet_state (
  device_id text primary key,
  vitality integer not null default 20,
  love_meter integer not null default 92,
  equipped text[] not null default '{}',
  pet_photo text,
  animal_id text not null default 'dog',
  updated_at timestamptz not null default now()
);

alter table public.pet_state enable row level security;

-- PawPlay has no accounts or login: every browser generates a random,
-- unguessable device id (a UUID) and only ever reads/writes its own row
-- using that id. There is no way to enforce per-user isolation at the
-- database level without auth, so this policy allows the anon key to
-- read/write rows generally -- privacy relies on the device id being
-- random and not shared, not on server-side access control. Do not
-- store anything sensitive in this table.
drop policy if exists "pet_state anon access" on public.pet_state;
create policy "pet_state anon access"
  on public.pet_state
  for all
  to anon
  using (true)
  with check (true);
