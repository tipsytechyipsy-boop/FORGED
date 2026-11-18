-- Santa's stash: the Christmas present hunt on the website.
-- Run this once in Supabase: SQL Editor > New query > paste > Run.
--
-- When someone finds all five presents, the website sends their stash code
-- (like STASH-K7QM2X) and gets back their place: 1st, 2nd, 3rd... The first 5
-- win the prize. The website can't read the list; only you can, here.

create table if not exists public.stash_finds (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^STASH-[A-HJ-NP-Z2-9]{6}$'),
  found_at timestamptz not null default now()
);

alter table public.stash_finds enable row level security;
-- No policies on purpose: the website can only use the two functions below.

-- Records a find and returns its place. Sending the same code again returns the
-- same place, so refreshing the page never moves anyone down the list.
create or replace function public.claim_stash(stash_code text)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  my_id bigint;
  my_place integer;
begin
  if stash_code !~ '^STASH-[A-HJ-NP-Z2-9]{6}$' then
    raise exception 'not a stash code';
  end if;
  -- Stop flooding the list: at most 300 finds in all.
  if (select count(*) from public.stash_finds) >= 300 then
    raise exception 'list full';
  end if;
  insert into public.stash_finds (code) values (stash_code)
    on conflict (code) do nothing;
  select id into my_id from public.stash_finds where code = stash_code;
  select count(*)::int into my_place from public.stash_finds where id <= my_id;
  return json_build_object('place', my_place);
end;
$$;

revoke all on function public.claim_stash(text) from public;
grant execute on function public.claim_stash(text) to anon, authenticated;

-- How many of the 5 prizes are still up for grabs (just a number).
create or replace function public.stash_left()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(0, 5 - count(*))::int from public.stash_finds;
$$;

revoke all on function public.stash_left() from public;
grant execute on function public.stash_left() to anon, authenticated;

-- Who won: the first 5 codes are the prize winners. At Sleigh the Run, check
-- the code on someone's screen against this list:
-- select row_number() over (order by id) as place, code, found_at
-- from public.stash_finds order by id limit 5;

-- ---------------------------------------------------------------------------
-- The team's check screen at theforged.in/?admin. Replace ADMIN_PASSWORD with
-- the team password before running; the real password never goes in this repo.
-- Actions: 'list' (the first 5), 'check' (one code), 'collect' (mark the prize given).
alter table public.stash_finds add column if not exists collected_at timestamptz;

create or replace function public.stash_admin(token text, action text, stash_code text default null)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  wanted text;
  row_id bigint;
  row_code text;
  row_found timestamptz;
  row_collected timestamptz;
  my_place integer;
begin
  if token is distinct from 'ADMIN_PASSWORD' then
    raise exception 'not allowed';
  end if;
  if action = 'list' then
    return coalesce((
      select json_agg(w order by w.place)
      from (
        select row_number() over (order by id) as place, code, found_at, collected_at
        from public.stash_finds order by id limit 5
      ) w
    ), '[]'::json);
  end if;
  wanted := upper(regexp_replace(coalesce(stash_code, ''), '\s', '', 'g'));
  if wanted !~ '^STASH-' then
    wanted := 'STASH-' || wanted;
  end if;
  select id, code, found_at, collected_at into row_id, row_code, row_found, row_collected
    from public.stash_finds where code = wanted;
  if row_id is null then
    return json_build_object('found', false, 'code', wanted);
  end if;
  select count(*)::int into my_place from public.stash_finds where id <= row_id;
  if action = 'collect' and my_place <= 5 and row_collected is null then
    update public.stash_finds set collected_at = now() where id = row_id
      returning collected_at into row_collected;
  end if;
  return json_build_object('found', true, 'code', row_code, 'place', my_place,
    'winner', my_place <= 5, 'found_at', row_found, 'collected_at', row_collected);
end;
$$;

revoke all on function public.stash_admin(text, text, text) from public;
grant execute on function public.stash_admin(text, text, text) to anon, authenticated;
