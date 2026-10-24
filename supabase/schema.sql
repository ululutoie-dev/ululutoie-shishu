-- Supabase の SQL Editor で実行する（何度実行しても安全）。管理者の登録は README の手順で別途行う。

-- 曲データ。lyrics は改行・空行・全角スペースをそのまま保持するプレーンテキスト。
create table if not exists public.songs (
  id          text primary key,
  title       text,                              -- null = 曲名未確認
  lyrics      text not null default '',
  sort_order  integer not null default 0,        -- 表示順（小さい順）
  photo_path  text,                              -- Storage(song-photos)内のパス。未設定は null
  settings    jsonb not null default '{}'::jsonb,-- 将来の拡張用（写真の配置・曲ごとのデザイン等）。今は未使用
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists songs_sort_order_idx on public.songs (sort_order);

create or replace function public.songs_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists songs_touch on public.songs;
create trigger songs_touch before update on public.songs for each row execute function public.songs_touch();

-- 管理者名簿。API（anon/authenticated）からは直接読み書きできない（ポリシーなし）。
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- songs：誰でも読める／書き込み(追加・更新・削除)は管理者のみ
alter table public.songs enable row level security;
drop policy if exists "songs public read" on public.songs;
drop policy if exists "songs admin insert" on public.songs;
drop policy if exists "songs admin update" on public.songs;
drop policy if exists "songs admin delete" on public.songs;
create policy "songs public read"  on public.songs for select using (true);
create policy "songs admin insert" on public.songs for insert to authenticated with check (public.is_admin());
create policy "songs admin update" on public.songs for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "songs admin delete" on public.songs for delete to authenticated using (public.is_admin());

-- Storage：写真用バケット（公開読み取り・5MBまで・JPEG/PNG/WebPのみ）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('song-photos', 'song-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "photos public read" on storage.objects;
drop policy if exists "photos admin insert" on storage.objects;
drop policy if exists "photos admin update" on storage.objects;
drop policy if exists "photos admin delete" on storage.objects;
create policy "photos public read"  on storage.objects for select using (bucket_id = 'song-photos');
create policy "photos admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'song-photos' and public.is_admin());
create policy "photos admin update" on storage.objects for update to authenticated using (bucket_id = 'song-photos' and public.is_admin()) with check (bucket_id = 'song-photos' and public.is_admin());
create policy "photos admin delete" on storage.objects for delete to authenticated using (bucket_id = 'song-photos' and public.is_admin());
