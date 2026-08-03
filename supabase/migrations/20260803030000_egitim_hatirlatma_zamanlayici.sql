-- Zamanlayıcı Supabase'de, Vercel'de değil.
--
-- Vercel'in cron'u ücretsiz planda günde yalnızca bir kez çalışıyor; "saat
-- 18:00'de bildirim at" işi dakika hassasiyeti istiyor. pg_cron her planda
-- çalışıyor ve zaten veritabanının yanında.
--
-- İşi burada yapmıyoruz, yalnızca uygulamayı dürtüyoruz: APNs gönderimi Node
-- tarafında (ES256 imza + HTTP/2), SQL'de yapılacak bir şey değil.
--
-- NOT: aşağıdaki anahtar Vercel'deki GOREV_ANAHTARI ile aynı olmalı. Bu dosya
-- depoda durduğu için gerçek değer buraya yazılmaz; kurulumda elle set edilir:
--
--   select cron.unschedule('egitim-hatirlatma');
--   select cron.schedule('egitim-hatirlatma', '*/5 * * * *', $$ ... $$);
--
-- Ayrıntı: docs/ios-uygulama.md

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('egitim-hatirlatma')
where exists (select 1 from cron.job where jobname = 'egitim-hatirlatma');

select cron.schedule(
  'egitim-hatirlatma',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://akademi-v2.vercel.app/api/gorevler/egitim-hatirlatma',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', current_setting('app.gorev_anahtari', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
