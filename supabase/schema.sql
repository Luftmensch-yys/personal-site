-- Guestbook sticky notes for yiyisa's space
-- Run in Supabase SQL Editor after creating a project.

create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 20),
  content text not null check (char_length(content) > 0 and char_length(content) <= 120),
  color text not null default 'pink',
  rotate double precision not null default 0,
  pos_left integer not null default 20,
  pos_top integer not null default 20,
  z_index integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists sticky_notes_created_at_idx
  on public.sticky_notes (created_at desc);

alter table public.sticky_notes enable row level security;

-- Anonymous visitors can read all notes
create policy "sticky_notes_select_anon"
  on public.sticky_notes
  for select
  to anon
  using (true);

-- Anonymous visitors can create notes (no delete/update via direct table access)
create policy "sticky_notes_insert_anon"
  on public.sticky_notes
  for insert
  to anon
  with check (true);

-- Position updates only through RPC (no anon UPDATE/DELETE policies on the table)
create or replace function public.update_sticky_note_position(
  note_id uuid,
  new_pos_left integer,
  new_pos_top integer,
  new_z_index integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sticky_notes
  set
    pos_left = new_pos_left,
    pos_top = new_pos_top,
    z_index = new_z_index
  where id = note_id;
end;
$$;

grant execute on function public.update_sticky_note_position(uuid, integer, integer, integer) to anon;
