-- Google Takvim etkinliğinin kimliği.
--
-- Etkinliği kurmak yetmiyor: saat değiştiğinde aynı etkinliği güncellemek,
-- görüşme iptal edildiğinde silmek gerekiyor. Kimlik saklanmazsa her
-- düzenleme takvime İKİNCİ bir etkinlik olarak düşer ve iptal edilen
-- görüşme takvimde durmaya devam eder.
--
-- Metin olarak tutuluyor: Google'ın etkinlik kimlikleri base32hex benzeri
-- serbest metin, uuid değil.
alter table public.gorusmeler add column if not exists takvim_etkinlik_id text;
alter table public.egitim_oturumlari add column if not exists takvim_etkinlik_id text;

comment on column public.gorusmeler.takvim_etkinlik_id is
  'Google Takvim etkinlik kimliği; planlama sırasında yazılır, iptalde temizlenir.';

-- Grup oturumunda her katılımcı için ayrı satır yazılıyor ama takvimde TEK
-- etkinlik var: aynı kimlik birden çok satırda duruyor. Bu yüzden benzersiz
-- dizin değil, yalnızca arama dizini — "bu etkinliğe bağlı başka satır var
-- mı" sorusu satır silinirken soruluyor.
create index if not exists egitim_oturumlari_takvim_idx
  on public.egitim_oturumlari (takvim_etkinlik_id)
  where takvim_etkinlik_id is not null;
