-- Panelde "yeni olan ne" sorusunun cevabı.
--
-- Rozet göstermek için bir şeyin ne zaman görüldüğünü bilmek gerekiyor.
-- Alternatifi her satıra okundu bayrağı koymaktı; o zaman her yeni bildirim
-- türü için ayrı bir sütun ve ayrı bir yazma yolu açmak gerekiyor. Burada
-- kişi başına bölüm başına tek bir zaman damgası var: sayım "bu tarihten
-- sonra oluşan kayıtlar" sorgusuna iniyor ve yeni bir bölüm eklemek yeni bir
-- satır anlamına geliyor, yeni bir şema değil.
--
-- Ödemeler bilerek buraya bakmıyor: ödeme "yeni mi" değil "duruyor mu"
-- sorusu. Bekleyen tutar varsa görülse de uyarı kalmalı.

create table if not exists public.panel_gorulme (
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Serbest metin: 'birebir', 'soru_cevap' gibi. Enum yapılmadı çünkü yeni
  -- bölüm eklemek migration gerektirmesin.
  alan text not null,
  gorulme timestamptz not null default now(),
  primary key (user_id, alan)
);

comment on table public.panel_gorulme is
  'Kişinin panel bölümlerini en son ne zaman gördüğü. Okunmamış rozetleri buradan hesaplanıyor.';

alter table public.panel_gorulme enable row level security;

-- Kendi satırı: okur, açar, günceller. Başkasınınkine hiç dokunamıyor.
-- Yönetici de bakabiliyor; kimin neyi görmediği destek tarafında işe yarıyor.
drop policy if exists panel_gorulme_select_own_or_admin on public.panel_gorulme;
create policy panel_gorulme_select_own_or_admin on public.panel_gorulme
  for select using ((user_id = (select auth.uid())) or is_admin());

drop policy if exists panel_gorulme_insert_own on public.panel_gorulme;
create policy panel_gorulme_insert_own on public.panel_gorulme
  for insert with check (user_id = (select auth.uid()));

drop policy if exists panel_gorulme_update_own on public.panel_gorulme;
create policy panel_gorulme_update_own on public.panel_gorulme
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update on public.panel_gorulme to authenticated;
