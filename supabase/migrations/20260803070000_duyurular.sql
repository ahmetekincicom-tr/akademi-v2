-- Gündem panosu: Meta ve sosyal medya tarafındaki gelişmeler.
--
-- Eğitim içeriğinden ayrı bir tablo: dersler kalıcı ve yapılandırılmış,
-- duyurular ise tarihli ve kısa ömürlü.

create table if not exists public.duyurular (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  baslik text not null,
  -- Hem listede hem push bildiriminin gövdesinde kullanılıyor; bu yüzden kısa
  -- ve tek başına anlamlı olmalı.
  ozet text not null default '',
  icerik text not null default '',
  kategori text not null default 'genel',
  onem text not null default 'normal' check (onem in ('normal', 'onemli', 'kritik')),
  durum text not null default 'taslak' check (durum in ('taslak', 'yayinda')),
  yayin_tarihi timestamptz,
  -- Aynı duyuru için iki kez bildirim gitmesin; damga burada.
  bildirim_gonderildi_tarihi timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists duyurular_yayin_idx
  on public.duyurular (yayin_tarihi desc)
  where durum = 'yayinda';

alter table public.duyurular enable row level security;

drop policy if exists "yayindaki duyurular okunur" on public.duyurular;
create policy "yayindaki duyurular okunur" on public.duyurular
  for select to authenticated
  using (durum = 'yayinda' or (select is_admin()));

drop policy if exists "duyurulari yonetici yonetir" on public.duyurular;
create policy "duyurulari yonetici yonetir" on public.duyurular
  for all to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

grant select, insert, update, delete on public.duyurular to authenticated;

create or replace function public.duyuru_guncelleme_damgasi()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists duyuru_updated_at on public.duyurular;
create trigger duyuru_updated_at before update on public.duyurular
  for each row execute function public.duyuru_guncelleme_damgasi();
