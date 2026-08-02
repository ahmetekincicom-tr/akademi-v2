-- Ön değerlendirme formunun adresi panelden giriliyor ama formu görecek olan
-- öğrenci; settings tablosu ise yalnızca admine açık (is_admin()).
--
-- olcumleme_ayarlari ile aynı yaklaşım: tabloyu açmak yerine yalnızca sır
-- içermeyen alanı adıyla yayınlayan bir view. Tabloda video.apiAnahtari,
-- meta.capiToken ve odeme.apiAnahtari gibi sırlar var; satır bazlı politika
-- ileride bu gruba bir sır eklenirse sessizce sızdırırdı.
--
-- Form adresi gizli bilgi değil: zaten öğrencinin tarayıcısına iframe olarak
-- gidiyor.

create or replace view public.form_ayarlari
with (security_invoker = off) as
select
  nullif(trim(deger ->> 'onDegerlendirme'), '') as on_degerlendirme
from public.settings
where anahtar = 'formlar';

comment on view public.form_ayarlari is
  'settings.formlar satırındaki form adreslerini panele açar. Sır içeren alanlar bilerek dışarıda; yeni alan eklerken bunu koru.';

grant select on public.form_ayarlari to anon, authenticated;
