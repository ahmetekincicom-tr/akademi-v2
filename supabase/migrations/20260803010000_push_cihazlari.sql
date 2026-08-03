-- Push bildirim için cihaz kayıtları.
--
-- Bir öğrencinin birden çok cihazı olabilir (telefon + tablet), o yüzden
-- profil başına tek satır değil, token başına tek satır tutuluyor.

create table if not exists public.push_cihazlar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null default 'ios' check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  son_gorulme timestamptz not null default now(),
  -- APNs "410 Unregistered" dönerse token ölmüştür; satırı silmek yerine
  -- işaretliyoruz ki gönderim raporu kaç cihazın düştüğünü gösterebilsin.
  gecersiz_tarihi timestamptz
);

create index if not exists push_cihazlar_user_idx on public.push_cihazlar (user_id);

alter table public.push_cihazlar enable row level security;

drop policy if exists "kendi cihazini gorur" on public.push_cihazlar;
create policy "kendi cihazini gorur" on public.push_cihazlar
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "kendi cihazini kaydeder" on public.push_cihazlar;
create policy "kendi cihazini kaydeder" on public.push_cihazlar
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "kendi cihazini gunceller" on public.push_cihazlar;
create policy "kendi cihazini gunceller" on public.push_cihazlar
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "kendi cihazini siler" on public.push_cihazlar;
create policy "kendi cihazini siler" on public.push_cihazlar
  for delete to authenticated using (user_id = auth.uid());

-- Yönetici gönderim için tüm cihazları okur.
drop policy if exists "yonetici tum cihazlari gorur" on public.push_cihazlar;
create policy "yonetici tum cihazlari gorur" on public.push_cihazlar
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Bu projede yetki kolon kolon veriliyor; tabloyu eklerken grant unutulursa
-- RLS geçse bile yazma sessizce reddedilir.
grant select, insert, update, delete on public.push_cihazlar to authenticated;

-- Gönderilen bildirimlerin kaydı: neyin kime gittiği görülebilsin.
create table if not exists public.push_gonderimler (
  id uuid primary key default gen_random_uuid(),
  baslik text not null,
  govde text not null,
  hedef_user_id uuid references public.profiles(id) on delete set null,
  cihaz_sayisi int not null default 0,
  basarili int not null default 0,
  hata_metni text,
  gonderen_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.push_gonderimler enable row level security;

drop policy if exists "yonetici gonderimleri yonetir" on public.push_gonderimler;
create policy "yonetici gonderimleri yonetir" on public.push_gonderimler
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

grant select, insert on public.push_gonderimler to authenticated;
