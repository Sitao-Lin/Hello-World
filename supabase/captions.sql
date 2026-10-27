-- Apply after setup.sql and auth.sql in the existing project.
begin;
create table public.ai_captions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 6 and 240),
  system_prompt text not null,
  caption text not null check (char_length(caption) between 1 and 400),
  vibe text not null check (vibe in ('dry','unhinged','wholesome')),
  model text not null,
  created_at timestamptz not null default now()
);
create table public.caption_votes (
  caption_id uuid not null references public.ai_captions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check(value in (-1,1)),
  primary key(caption_id,user_id)
);
create table public.caption_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on public.ai_captions(created_at desc);
create index on public.caption_attempts(user_id,created_at);
alter table public.ai_captions enable row level security;
alter table public.caption_votes enable row level security;
alter table public.caption_attempts enable row level security;
revoke all on public.ai_captions, public.caption_votes, public.caption_attempts from anon, authenticated;
grant select, insert on public.caption_votes to authenticated;
grant update(value) on public.caption_votes to authenticated;
grant all on public.ai_captions, public.caption_votes, public.caption_attempts to service_role;
create policy own_vote_read on public.caption_votes for select to authenticated using(user_id = (select auth.uid()));
create policy own_vote_insert on public.caption_votes for insert to authenticated with check(user_id = (select auth.uid()));
create policy own_vote_update on public.caption_votes for update to authenticated using(user_id = (select auth.uid())) with check(user_id = (select auth.uid()));
-- PostgREST upsert includes the immutable conflict-key columns in UPDATE.
-- An RPC below updates only value, preserving those keys and restricted grants.
create function public.cast_caption_vote(target uuid, rating smallint) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.caption_votes(caption_id,user_id,value) values(target,auth.uid(),rating)
  on conflict(caption_id,user_id) do update set value=excluded.value;
end;
$$;
revoke all on function public.cast_caption_vote(uuid,smallint) from public,anon;
grant execute on function public.cast_caption_vote(uuid,smallint) to authenticated;
-- Exposes only public content, totals and the caller's vote, never voter IDs.
create function public.caption_feed() returns table(id uuid,prompt text,caption text,vibe text,created_at timestamptz,score bigint,votes bigint,my_vote smallint)
language sql stable security definer set search_path = '' as $$
  select c.id,c.prompt,c.caption,c.vibe,c.created_at,
    coalesce((select sum(v.value) from public.caption_votes v where v.caption_id=c.id),0),
    (select count(*) from public.caption_votes v where v.caption_id=c.id),
    coalesce((select v.value from public.caption_votes v where v.caption_id=c.id and v.user_id=auth.uid()),0)::smallint
  from public.ai_captions c order by c.created_at desc,c.id limit 50;
$$;
revoke all on function public.caption_feed() from public;
grant execute on function public.caption_feed() to anon,authenticated;
-- Atomic quota reservation serializes concurrent requests for the same user.
create function public.reserve_caption_attempt() returns boolean
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text,0));
  if (select count(*) from public.caption_attempts where user_id=caller and created_at>now()-interval '24 hours') >= 5 then return false; end if;
  insert into public.caption_attempts(user_id) values(caller);
  return true;
end;
$$;
revoke all on function public.reserve_caption_attempt() from public,anon;
grant execute on function public.reserve_caption_attempt() to authenticated;
-- Preserve all existing book, profile and avatar policies. Enable RLS for any
-- other public tables too; tables without policies fail closed.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security',t.tablename);
  end loop;
end $$;
commit;
