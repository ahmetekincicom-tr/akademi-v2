-- Apple App Store 5.1.1(v): hesap sistemi olan uygulamalar, kullanıcının
-- hesabını uygulama İÇİNDEN silmeye başlatabilmesini şart koşuyor.
--
-- Silme işlemi tek adımda tamamlanmıyor, bilerek: hesap ödeme ve fatura
-- kayıtlarına bağlı ve bunların yasal saklama süresi var. Öğrenci talebi
-- uygulamadan başlatıyor, damga buraya düşüyor, eğitmen kalan veriyi
-- temizleyip hesabı kapatıyor. Apple bu akışı kabul ediyor; şart olan,
-- talebin uygulama içinden başlatılabilmesi.

alter table profiles
  add column if not exists silme_talebi_tarihi timestamptz;

comment on column profiles.silme_talebi_tarihi is
  'Öğrencinin uygulamadan başlattığı hesap silme talebinin zamanı. Boşsa talep yok.';

-- profiles'ta UPDATE yetkisi kolon kolon veriliyor (ad, soyad, telefon,
-- sirket, on_degerlendirme_tarihi). Yeni kolon listeye eklenmezse öğrencinin
-- kendi talebi sessizce reddedilir — RLS geçse bile yetki katmanı önde.
grant update (silme_talebi_tarihi) on public.profiles to authenticated;
