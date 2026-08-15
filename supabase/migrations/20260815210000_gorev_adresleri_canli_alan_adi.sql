-- Zamanlanmış görevlerin adresini canlı alan adına taşı.
--
-- İki iş de kurulurken dağıtım adresine (akademi-v2.vercel.app) bağlanmıştı.
-- Bugün hâlâ çalışıyorlar — Vercel o adresi ayakta tutuyor — ama bu adres
-- projeye değil dağıtıma ait: proje adı değişirse, dağıtım koruması açılırsa
-- ya da alan adı taşınırsa iki görev de sessizce ölür. Sessizce, çünkü
-- pg_cron başarısız isteği yalnızca kendi kayıt tablosuna yazıyor.
--
-- Kaybı somut: egitim-hatirlatma ölürse öğrenciye ders bildirimi gitmez,
-- odeme-mutabakat ölürse dönüşü kaybolmuş ödeme "bekliyor" olarak kalır.
--
-- Anahtar (app.gorev_anahtari) değişmiyor; yalnızca adres güncelleniyor.

select cron.unschedule('egitim-hatirlatma')
where exists (select 1 from cron.job where jobname = 'egitim-hatirlatma');

select cron.schedule(
  'egitim-hatirlatma',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/egitim-hatirlatma',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', current_setting('app.gorev_anahtari', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

select cron.unschedule('odeme-mutabakat')
where exists (select 1 from cron.job where jobname = 'odeme-mutabakat');

select cron.schedule(
  'odeme-mutabakat',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/odeme-mutabakat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', current_setting('app.gorev_anahtari', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
