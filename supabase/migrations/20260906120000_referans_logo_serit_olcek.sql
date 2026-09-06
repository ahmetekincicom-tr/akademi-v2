-- Kayan şerit için AYRI logo ölçekleri (web + mobil).
--
-- logo_olcek / logo_olcek_mobil yalnızca /referanslar ızgarasını ayarlıyordu.
-- Kayan şeritte (ana sayfa, hakkımızda, kurumsal) kartlar ve oranlar farklı;
-- orada da logo başına ince ayar gerekebiliyor (ör. çok geniş YTU). Bu iki alan
-- yalnızca şeridi etkiler, ızgaraya dokunmaz.

alter table public.referanslar
  add column if not exists logo_olcek_serit smallint not null default 100,
  add column if not exists logo_olcek_serit_mobil smallint not null default 100;

comment on column public.referanslar.logo_olcek_serit is
  'Logonun KAYAN ŞERİT masaüstü görünümündeki ölçeği (yüzde). Izgara ölçeğinden bağımsız.';
comment on column public.referanslar.logo_olcek_serit_mobil is
  'Logonun KAYAN ŞERİT mobil görünümündeki ölçeği (yüzde). Yalnızca mobil şeridi etkiler.';

alter table public.referanslar drop constraint if exists referanslar_logo_olcek_serit_araligi;
alter table public.referanslar add constraint referanslar_logo_olcek_serit_araligi
  check (logo_olcek_serit between 50 and 200);
alter table public.referanslar drop constraint if exists referanslar_logo_olcek_serit_mobil_araligi;
alter table public.referanslar add constraint referanslar_logo_olcek_serit_mobil_araligi
  check (logo_olcek_serit_mobil between 50 and 200);
