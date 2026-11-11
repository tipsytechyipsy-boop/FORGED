-- FORGED RSVPs. Run this once in Supabase: SQL Editor > New query > paste > Run.
-- The website can only ADD an RSVP and read the headcount. It can never read
-- anyone's name or phone number; only you can, in the Supabase dashboard.

create table if not exists public.rsvps (
  id bigint generated always as identity primary key,
  event text not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone text check (phone is null or char_length(phone) <= 20),
  attending boolean not null,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- Visitors may add an RSVP, but only for events that are open.
drop policy if exists "visitors can rsvp" on public.rsvps;
create policy "visitors can rsvp" on public.rsvps
  for insert to anon
  with check (event in ('run-and-rave-2026-11-22'));

-- No select policy on purpose: nobody can read the list from the website.

-- The headcount the website shows: just a number, no names.
create or replace function public.rsvp_count(event_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.rsvps where event = event_id and attending;
$$;

revoke all on function public.rsvp_count(text) from public;
grant execute on function public.rsvp_count(text) to anon, authenticated;

-- To see who's coming: Table Editor > rsvps, or run:
-- select name, phone, attending, created_at from public.rsvps
-- where event = 'run-and-rave-2026-11-22' order by created_at;

-- The poll: how many said yes and how many said no. Numbers only, no names.
create or replace function public.rsvp_tally(event_id text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'yes', count(*) filter (where attending),
    'no', count(*) filter (where not attending)
  )
  from public.rsvps where event = event_id;
$$;

revoke all on function public.rsvp_tally(text) from public;
grant execute on function public.rsvp_tally(text) to anon, authenticated;
