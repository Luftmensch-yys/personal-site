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


-- Existing installation: run this entire file in Supabase SQL Editor as admin.
-- Preserves every sticky_notes row. Legacy rows receive NO ownership record.
begin;

create schema if not exists guestbook_private;
revoke all on schema guestbook_private from public, anon, authenticated;

create table if not exists guestbook_private.note_ownership (
  note_id uuid primary key references public.sticky_notes(id) on delete cascade,
  token_hash bytea not null check (octet_length(token_hash) = 32)
);
alter table guestbook_private.note_ownership enable row level security;
revoke all on guestbook_private.note_ownership from public, anon, authenticated;

alter table public.sticky_notes enable row level security;
drop policy if exists "sticky_notes_insert_anon" on public.sticky_notes;
drop policy if exists "sticky_notes_select_anon" on public.sticky_notes;
create policy "sticky_notes_select_anon" on public.sticky_notes
  for select to anon using (true);
-- Writes are confined to the functions below, even if a stray policy exists.
revoke all on public.sticky_notes from public, anon, authenticated;
grant select on public.sticky_notes to anon;

create or replace function public.create_sticky_note(
  note_id uuid, owner_token text, note_name text, note_content text,
  note_color text, note_rotate double precision,
  note_left integer, note_top integer, note_z_index integer
)
returns setof public.sticky_notes
language plpgsql
security definer
set search_path = ''
as $$
begin
  if note_id is null or owner_token is null or owner_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid note credential' using errcode = '22023';
  end if;
  if note_color is null or note_color not in ('pink', 'green', 'blue', 'purple', 'orange')
    or note_rotate is null or note_rotate not between -10 and 10
    or note_left is null or note_left not between 0 and 100000
    or note_top is null or note_top not between 0 and 100000
    or note_z_index is null or note_z_index < 1 then
    raise exception 'Invalid note appearance' using errcode = '22023';
  end if;

  -- No upsert: an existing ID (including a legacy note) can never be claimed.
  insert into public.sticky_notes (id, name, content, color, rotate, pos_left, pos_top, z_index)
  values (note_id, note_name, note_content, note_color, note_rotate, note_left, note_top, note_z_index);
  insert into guestbook_private.note_ownership (note_id, token_hash)
  values (note_id, pg_catalog.sha256(pg_catalog.convert_to(owner_token, 'UTF8')));
  return query select n.* from public.sticky_notes as n where n.id = note_id;
end;
$$;

create or replace function public.delete_sticky_note(note_id uuid, owner_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if note_id is null or owner_token is null or owner_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid note credential' using errcode = '42501';
  end if;
  delete from public.sticky_notes as n
  where n.id = note_id and exists (
    select 1 from guestbook_private.note_ownership as o
    where o.note_id = n.id
      and o.token_hash = pg_catalog.sha256(pg_catalog.convert_to(owner_token, 'UTF8'))
  );
  if not found then
    -- Same response for nonexistent, legacy, wrong-token, and already deleted notes.
    raise exception 'Invalid note credential' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.update_sticky_note_position(
  note_id uuid, new_pos_left integer, new_pos_top integer, new_z_index integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new_pos_left is null or new_pos_left not between 0 and 100000
    or new_pos_top is null or new_pos_top not between 0 and 100000
    or new_z_index is null or new_z_index < 1 then
    raise exception 'Invalid note position' using errcode = '22023';
  end if;
  update public.sticky_notes set pos_left = new_pos_left, pos_top = new_pos_top, z_index = new_z_index
  where id = note_id;
end;
$$;

-- Functions default to PUBLIC EXECUTE: remove it in the same transaction.
revoke all on function public.create_sticky_note(uuid,text,text,text,text,double precision,integer,integer,integer) from public, anon, authenticated;
revoke all on function public.delete_sticky_note(uuid,text) from public, anon, authenticated;
revoke all on function public.update_sticky_note_position(uuid,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.create_sticky_note(uuid,text,text,text,text,double precision,integer,integer,integer) to anon;
grant execute on function public.delete_sticky_note(uuid,text) to anon;
grant execute on function public.update_sticky_note_position(uuid,integer,integer,integer) to anon;

notify pgrst, 'reload schema';
commit;

