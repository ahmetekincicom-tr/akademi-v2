-- Ön değerlendirme testi Tally'de duruyor; cevaplar orada kalıyor. Panelin
-- bilmesi gereken tek şey testin doldurulup doldurulmadığı, o yüzden burada
-- yalnızca bir zaman damgası var.
--
-- Öğrenci kendi profilini güncelleyebildiği için (profiles_update_own) bu
-- alanı da kendisi işaretleyebilir. Kritik bir yetki taşımıyor: en fazla
-- karşılama ekranındaki adımı erkenden kapatmış olur.

alter table profiles
  add column if not exists on_degerlendirme_tarihi timestamptz;

comment on column profiles.on_degerlendirme_tarihi is
  'Tally ön değerlendirme formunun doldurulduğu an. Cevaplar Tally tarafında kalır.';
