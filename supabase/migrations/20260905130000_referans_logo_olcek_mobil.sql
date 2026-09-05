-- Referans logolarına AYRI bir MOBİL görünüm ölçeği.
--
-- logo_olcek masaüstünü ayarlıyordu ama tek değer iki kırılımı birden
-- etkiliyordu. Mobil kartlar dar olduğu için orada bambaşka bir ölçek
-- gerekebiliyor; bu alan yalnızca mobili etkiler, masaüstünü değiştirmez.

alter table public.referanslar
  add column if not exists logo_olcek_mobil smallint not null default 100;

comment on column public.referanslar.logo_olcek_mobil is
  'Logonun MOBİL referans ızgarasındaki görünüm ölçeği (yüzde). 100 = varsayılan. logo_olcek masaüstünü, bu alan yalnızca mobili etkiler.';

alter table public.referanslar drop constraint if exists referanslar_logo_olcek_mobil_araligi;
alter table public.referanslar add constraint referanslar_logo_olcek_mobil_araligi
  check (logo_olcek_mobil between 50 and 200);
