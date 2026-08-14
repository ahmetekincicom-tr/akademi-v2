-- Ödeme mutabakatı zamanlayıcısı.
--
-- 3D Secure dönüşü tek nokta arıza: tarayıcı kapanır, ağ kopar, yönlendirme
-- engellenir. O anda para çekilmiş ama kaydımız "bekliyor" kalır. Bu görev
-- sonucu belli olmamış denemeleri iyzico'ya sorup kesinleştiriyor.
--
-- Her 15 dakikada bir yeterli: acil olan ödemeyi ANINDA işaretlemek değil,
-- hiçbir ödemenin kaybolmaması. Anında işaretlemeyi zaten dönüş isteği yapıyor.
--
-- NOT: anahtar Vercel'deki GOREV_ANAHTARI ile aynı olmalı ve app.gorev_anahtari
-- ayarı egitim-hatirlatma kurulumunda zaten set edilmiş olmalı. Adres de o
-- görevle aynı yerden alınıyor — alan adı değişirse ikisi birlikte güncellenir.

select cron.unschedule('odeme-mutabakat')
where exists (select 1 from cron.job where jobname = 'odeme-mutabakat');

select cron.schedule(
  'odeme-mutabakat',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://akademi-v2.vercel.app/api/gorevler/odeme-mutabakat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', current_setting('app.gorev_anahtari', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
