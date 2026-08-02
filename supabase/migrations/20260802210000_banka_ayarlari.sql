-- Havale/EFT bilgileri admin panelinden giriliyor ama görecek olan öğrenci;
-- settings tablosu ise yalnızca admine açık (is_admin()).
--
-- olcumleme_ayarlari ve form_ayarlari ile aynı yaklaşım: tabloyu açmak yerine
-- yalnızca sır içermeyen alanları adıyla yayınlayan bir view. Tabloda
-- video.apiAnahtari, meta.capiToken ve odeme.apiAnahtari gibi sırlar var.
--
-- IBAN gizli bilgi değil; ödemeyi yapacak kişiye zaten gösterilecek. Ödeme
-- SAĞLAYICI bilgileri (odeme grubu, API anahtarı dahil) bilerek dışarıda.

create or replace view public.banka_ayarlari
with (security_invoker = off) as
select
  nullif(trim(deger ->> 'unvan'), '')     as unvan,
  nullif(trim(deger ->> 'banka'), '')     as banka,
  nullif(trim(deger ->> 'iban'), '')      as iban,
  nullif(trim(deger ->> 'aciklama'), '')  as aciklama
from public.settings
where anahtar = 'banka';

comment on view public.banka_ayarlari is
  'settings.banka satırındaki havale bilgilerini panele açar. Sır içeren alanlar bilerek dışarıda; yeni alan eklerken bunu koru.';

grant select on public.banka_ayarlari to anon, authenticated;
