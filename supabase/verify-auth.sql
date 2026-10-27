-- Run in the Supabase SQL Editor. All fixtures roll back.
begin;
do $$
declare reader_id uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (reader_id);
  if (select count(*) from public.profiles where id = reader_id) <> 1 then
    raise exception 'New user trigger did not create exactly one profile';
  end if;
  if exists (select 1 from public.profiles where id = reader_id and (first_name is not null or last_name is not null)) then
    raise exception 'New profile should start with nullable names';
  end if;
  if not exists (select 1 from storage.buckets where id = 'avatars' and public = false and file_size_limit = 2097152) then
    raise exception 'Expected private avatars bucket with a 2 MB limit';
  end if;
  if has_table_privilege('anon', 'public.profiles', 'SELECT') then
    raise exception 'Anonymous users must not read profiles';
  end if;
end $$;
rollback;
