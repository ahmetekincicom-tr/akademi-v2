-- Referans logolarına görünüm ölçeği (yüzde).
--
-- Kırpma ve kutuya-sığdır tüm logoları aynı kutu boyuna getiriyor; ama boy her
-- şey değil. Amblem + ince yazı gibi "seyrek" bir logo (ör. TTK), kalın bir
-- wordmark (ör. TRT) ile aynı kutuda bile daha küçük algılanıyor. Tek tip
-- otomatik boyutlandırma bunu çözemez — o logoyu elle biraz büyütmek gerekir.
--
-- logo_olcek bu elle ayarı taşıyor: 100 = varsayılan; seyrek logolar 120–140'a
-- çekilip diğerlerine optik olarak eşitleniyor.

alter table public.referanslar
  add column if not exists logo_olcek smallint not null default 100;

comment on column public.referanslar.logo_olcek is
  'Logonun referans ızgarasındaki görünüm ölçeği (yüzde). 100 = varsayılan. Seyrek (amblem+ince yazı) logoları kalın logolarla optik olarak eşitlemek için elle ayarlanır.';

alter table public.referanslar drop constraint if exists referanslar_logo_olcek_araligi;
alter table public.referanslar add constraint referanslar_logo_olcek_araligi
  check (logo_olcek between 50 and 200);
