-- Supabase の SQL Editor で1回だけ実行する。YOUR_EMAIL@example.com を本人のメールアドレスに置き換えること。
create table if not exists public.poetry_book (
  id text primary key,
  songs jsonb not null,
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
-- 誤保存に備えた履歴（上書き前の内容を自動保存。公開側からは読めない）
create table if not exists public.poetry_book_history (
  hid bigserial primary key, id text, songs jsonb, theme jsonb, saved_at timestamptz not null default now()
);
alter table public.poetry_book enable row level security;
alter table public.poetry_book_history enable row level security;

-- 誰でも読める（公開ページ用）
create policy "public read" on public.poetry_book for select using (true);
-- 書き込みはログイン済みで、かつ本人のメールアドレスの場合のみ
create policy "owner insert" on public.poetry_book for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');
create policy "owner update" on public.poetry_book for update to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com')
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');
-- 削除ポリシーなし＝誰も削除できない。history にはポリシーなし＝API経由では読み書き不可。

create or replace function public.poetry_book_archive() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.poetry_book_history(id, songs, theme) values (old.id, old.songs, old.theme);
  return new;
end $$;
drop trigger if exists poetry_book_archive on public.poetry_book;
create trigger poetry_book_archive before update on public.poetry_book
  for each row execute function public.poetry_book_archive();
