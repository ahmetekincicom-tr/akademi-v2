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

-- profiles'ta UPDATE yetkisi kolon kolon veriliyor (ad, soyad, telefon,
-- sirket). Yeni kolon o listeye eklenmezse öğrencinin kendi işaretlemesi
-- sessizce reddedilir — RLS geçse bile yetki katmanı önde duruyor.
grant update (on_degerlendirme_tarihi) on public.profiles to authenticated;
