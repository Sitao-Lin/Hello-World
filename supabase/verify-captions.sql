-- Run as postgres in the SQL editor after captions.sql. All fixtures roll back.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-0000000000a1'),('00000000-0000-4000-8000-0000000000b2');
insert into public.ai_captions(id,user_id,prompt,system_prompt,caption,vibe,model)
values ('00000000-0000-4000-8000-0000000000c3','00000000-0000-4000-8000-0000000000a1','Test moment','Test instruction','Test output','dry','test');
set local role anon;
select count(*) from public.caption_feed();
do $$ begin
  begin
    insert into public.caption_votes values ('00000000-0000-4000-8000-0000000000c3','00000000-0000-4000-8000-0000000000a1',1);
    raise exception 'FAIL: anonymous vote accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
select public.cast_caption_vote('00000000-0000-4000-8000-0000000000c3',1::smallint);
select public.cast_caption_vote('00000000-0000-4000-8000-0000000000c3',(-1)::smallint);
do $$ begin
  if (select count(*) from public.caption_votes where caption_id='00000000-0000-4000-8000-0000000000c3') <> 1 then raise exception 'FAIL: duplicate vote'; end if;
  if (select value from public.caption_votes where caption_id='00000000-0000-4000-8000-0000000000c3') <> -1 then raise exception 'FAIL: vote did not change'; end if;
  begin
    insert into public.ai_captions(user_id,prompt,system_prompt,caption,vibe,model) values(auth.uid(),'Fake moment','Fake instruction','Fake output','dry','fake');
    raise exception 'FAIL: client could forge AI output';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000b2',true);
do $$ begin
  if exists(select 1 from public.caption_votes where user_id='00000000-0000-4000-8000-0000000000a1') then raise exception 'FAIL: other votes exposed'; end if;
  begin
    insert into public.caption_votes values ('00000000-0000-4000-8000-0000000000c3','00000000-0000-4000-8000-0000000000a1',1);
    raise exception 'FAIL: impersonated vote';
  exception when insufficient_privilege then null; end;
  for i in 1..5 loop
    if not public.reserve_caption_attempt() then raise exception 'FAIL: allowance rejected'; end if;
  end loop;
  if public.reserve_caption_attempt() then raise exception 'FAIL: allowance exceeded'; end if;
end $$;
reset role;
do $$ begin
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) then raise exception 'FAIL: public table without RLS'; end if;
end $$;
rollback;
