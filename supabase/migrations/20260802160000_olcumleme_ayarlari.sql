-- Ölçümleme etiketlerinin (GA4, GTM, Google Ads) public sayfalarda
-- çalışabilmesi için ziyaretçinin bu tanımlayıcıları okuyabilmesi gerekir.
--
-- settings tablosu bütünüyle açılamaz: içinde video.apiAnahtari,
-- meta.capiToken ve odeme.apiAnahtari gibi sırlar duruyor. Satır bazlı bir
-- politika da yetmez — google satırına ileride Measurement Protocol
-- api_secret gibi bir sır eklenirse sessizce sızardı.
--
-- Bu yüzden yalnızca dört tanımlayıcıyı adıyla yayınlayan bir view var.
-- Yeni bir alan buraya elle eklenmediği sürece dışarı çıkmaz.
--
-- Bu ID'ler zaten sayfa kaynağında görünür; gizli bilgi değiller.

create or replace view public.olcumleme_ayarlari
with (security_invoker = off) as
select
  nullif(trim(deger ->> 'ga4'), '')       as ga4,
  nullif(trim(deger ->> 'gtm'), '')       as gtm,
  nullif(trim(deger ->> 'adsId'), '')     as ads_id,
  nullif(trim(deger ->> 'adsEtiket'), '') as ads_etiket
from public.settings
where anahtar = 'google';

comment on view public.olcumleme_ayarlari is
  'settings.google satırındaki ölçümleme tanımlayıcılarını public okumaya açar. Sır içeren alanlar bilerek dışarıda bırakıldı; yeni alan eklerken bunu koru.';

-- security_invoker = off olduğu için view, settings üzerindeki is_admin()
-- politikasını sahibinin hakkıyla aşar. Erişim yalnızca bu dört kolonla
-- sınırlı; yazma hakkı verilmiyor.
grant select on public.olcumleme_ayarlari to anon, authenticated;
