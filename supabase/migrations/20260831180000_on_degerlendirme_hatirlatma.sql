-- Ön değerlendirme hatırlatması: gönderim damgası ve zamanlayıcı.
--
-- Erişimi açılan kişinin testi doldurması gerekiyor ama panele her gün kimse
-- girmiyor: rozet paneldeki kişiye çalışıyor, panele girmeyene bir şey
-- söylemiyor. Bu görev, erişimi açıldıktan sonra testi hâlâ doldurmamış olana
-- BİR KEZ hatırlatıyor.
--
-- Damga profiles'ta çünkü test durumu da orada (on_degerlendirme_tarihi).
-- Ayrı bir tablo, aynı kişinin iki satırını birlikte tutmak demekti.
--
-- Damga gönderimden SONRA atılıyor: görev ortada çökerse mail hiç gitmemiş
-- sayılır ve bir sonraki tur tekrar dener. Tersi olsaydı sessizce kaybolurdu —
-- bu depoda aynı sıralama egitim-hatirlatma görevinde de böyle.

alter table public.profiles
  add column if not exists on_degerlendirme_hatirlatma_tarihi timestamptz;

comment on column public.profiles.on_degerlendirme_hatirlatma_tarihi is
  'Ön değerlendirme hatırlatma maili gönderildiği an. Doluysa bir daha gönderilmiyor.';

-- Saatte bir yeterli: hatırlatma erişim açıldıktan 48 saat sonra gidiyor,
-- dakika hassasiyeti gerektiren bir iş değil. Dakika 20 seçildi ki diğer
-- görevlerin yoğunlaştığı tam saat başına binmesin.
select cron.unschedule('on-degerlendirme-hatirlatma')
where exists (select 1 from cron.job where jobname = 'on-degerlendirme-hatirlatma');

select cron.schedule(
  'on-degerlendirme-hatirlatma',
  '20 * * * *',
  $$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/on-degerlendirme-hatirlatma',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', private.gorev_anahtari()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
