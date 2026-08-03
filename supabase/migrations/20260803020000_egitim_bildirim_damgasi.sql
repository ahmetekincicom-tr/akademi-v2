-- Otomatik eğitim bildirimi için gönderim damgası.
--
-- Damga oturumun kendi satırında: ayrı bir "gönderildi" tablosu tutmak, hangi
-- oturumun bildirimi bekleyeceğini bulmak için her turda join gerektirirdi.

alter table public.egitim_oturumlari
  add column if not exists bildirim_gonderildi_tarihi timestamptz;

comment on column public.egitim_oturumlari.bildirim_gonderildi_tarihi is
  'Başlangıç bildiriminin gönderildiği an. Boşsa henüz gönderilmedi.';

-- Görev her 5 dakikada bir yalnızca bildirimi bekleyen satırları arıyor;
-- kısmi indeks tablo büyüdükçe taramayı sabit tutuyor.
create index if not exists egitim_oturumlari_bildirim_bekleyen_idx
  on public.egitim_oturumlari (baslangic)
  where bildirim_gonderildi_tarihi is null and durum = 'planlandi';
