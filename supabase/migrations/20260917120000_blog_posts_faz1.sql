-- Blog (Faz 1): yazı tablosu + RLS.
--
-- courses ile aynı desen: herkes yayınlananı okur, yazma yalnızca admin.
-- İçerik iki biçimde tutuluyor: TipTap kaynak belgesi (icerik_json, kayıpsız
-- düzenleme) ve türetilmiş HTML (icerik_html, hızlı herkese açık render).

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  baslik text not null,
  ozet text not null default '',
  icerik_json jsonb not null default '{}'::jsonb,
  icerik_html text not null default '',
  kapak_gorsel text,
  durum text not null default 'taslak' check (durum in ('taslak','yayin')),
  yayin_tarihi timestamptz,
  seo_baslik text not null default '',
  seo_aciklama text not null default '',
  yazar text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy posts_public_read on public.posts
  for select using (durum = 'yayin' or is_admin());
create policy posts_admin_insert on public.posts
  for insert with check (is_admin());
create policy posts_admin_update on public.posts
  for update using (is_admin());
create policy posts_admin_delete on public.posts
  for delete using (is_admin());

create index if not exists posts_yayin_idx
  on public.posts (yayin_tarihi desc) where durum = 'yayin';
