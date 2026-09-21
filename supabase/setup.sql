begin;
create table if not exists public.books (
  id bigint generated always as identity primary key,
  title text not null unique,
  author text not null,
  description text not null default ''
);
alter table public.books enable row level security;
revoke all on public.books from anon, authenticated;
grant select on public.books to anon, authenticated;
drop policy if exists "Anyone can read books" on public.books;
create policy "Anyone can read books" on public.books
  for select to anon, authenticated using (true);
insert into public.books (title, author, description) values
  ('Pride and Prejudice', 'Jane Austen', 'A spirited story of first impressions, family expectations, and finding a connection beyond appearances.'),
  ('The Hobbit', 'J. R. R. Tolkien', 'A quiet homebody leaves his comfortable life for a journey filled with unexpected courage and extraordinary company.'),
  ('A Wizard of Earthsea', 'Ursula K. Le Guin', 'A young wizard discovers that understanding himself may be the most demanding magic of all.')
on conflict (title) do nothing;
commit;
