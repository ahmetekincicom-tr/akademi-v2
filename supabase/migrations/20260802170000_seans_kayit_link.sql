-- Eğitim sırasında alınan seans kayıtları Drive'da duruyor ve yalnızca o
-- seansın katılımcısını ilgilendiriyor. Bağlantıyı seanslar tablosunda
-- tutmak erişim denetimini bedavaya getiriyor: seanslar_select_own_or_admin
-- politikası zaten satırı yalnızca sahibine ve admine gösteriyor.
--
-- Ders videolarından ayrı bir şey: lessons.video_url eğitime kayıtlı herkese
-- açık içerik, bu ise kişiye özel kayıt.

alter table seanslar
  add column if not exists kayit_link text;

comment on column seanslar.kayit_link is
  'Seansın kişiye özel kaydı (Drive vb.). Yalnızca seansın sahibi ve admin okuyabilir.';
