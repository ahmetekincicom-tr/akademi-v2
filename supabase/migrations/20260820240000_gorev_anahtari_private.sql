-- Zamanlanmış görevlerin anahtarı artık sunucu ayarında değil, tabloda.
--
-- SOMUT ARIZA: bütün HTTP cron görevleri 401 alıyordu ve kimse fark etmemişti.
-- egitim-hatirlatma, odeme-mutabakat ve meta-kuyruk aylardır her turda
-- "Yetkisiz" cevabı alıp geri dönüyordu. Ödeme mutabakatı — 3D Secure dönüşü
-- koptuğunda parayı kurtaran o emniyet ağı — hiç çalışmamıştı.
--
-- Sebebi: komutlar anahtarı current_setting('app.gorev_anahtari') ile
-- okuyordu ve o ayar veritabanında HİÇ TANIMLI DEĞİLDİ. Tanımlı olmayan bir
-- ayar current_setting(..., true) ile boş dönüyor, hata vermiyor — istek boş
-- başlıkla gidiyor, uç nokta reddediyor, cron "succeeded" yazıyor. Üç sessiz
-- katman üst üste.
--
-- Kalıcı çözüm neden ayarı doldurmak değil: `alter database ... set` superuser
-- istiyor. Yani anahtar, kimsenin göremediği ve migration'ın kuramadığı bir
-- yerde duruyordu. Kurulumun bir adımı elle yapılmak zorunda kalırsa, er geç
-- yapılmıyor — burada olan tam olarak bu.
--
-- Artık anahtar sıradan bir satır: migration kurabiliyor, panelden
-- görülebiliyor, yedeklere giriyor.

/* ------------------------------------------------------ private şema --- */

/*
  `private` şeması PostgREST'e kapalı.

  Supabase yalnızca API ayarlarında listelenen şemaları yayınlıyor (public ve
  graphql_public). Buradaki hiçbir tabloya REST üzerinden ulaşılamıyor —
  anahtarı public'te bir tabloda tutmak, RLS'in bir gün yanlışlıkla
  kapatılmasına bağlı kalmak olurdu.
*/
create schema if not exists private;
revoke all on schema private from anon, authenticated, public;

create table if not exists private.gorev_ayarlari (
  anahtar text primary key,
  deger text not null,
  guncelleme timestamptz not null default now()
);

comment on table private.gorev_ayarlari is
  'Zamanlayıcının kullandığı sırlar. Vercel tarafındaki GOREV_ANAHTARI ile aynı olmalı; ikisi ayrıştığında bütün HTTP görevleri 401 alır.';

revoke all on table private.gorev_ayarlari from anon, authenticated, public;

/*
  Anahtarın DEĞERİ bu dosyada YOK ve olmamalı.

  Migration'lar depoya giriyor; sırrı buraya yazmak onu herkese açık bir
  geçmişe gömmek olurdu. Değer elle bir kez giriliyor:

    insert into private.gorev_ayarlari (anahtar, deger)
    values ('gorev_anahtari', '<Vercel''deki GOREV_ANAHTARI ile aynı>')
    on conflict (anahtar) do update set deger = excluded.deger, guncelleme = now();
*/

/* --------------------------------------------------------- okuyucu --- */

/*
  Anahtarı okuyan tek yol.

  SECURITY DEFINER ve yetkisi yalnızca zamanlayıcıda: oturum açmış birine
  açık bırakılsaydı, herhangi bir katılımcı REST üzerinden çağırıp görev
  anahtarını öğrenir ve bütün zamanlanmış uçları elle tetikleyebilirdi.

  private şeması zaten yayınlanmıyor; bu revoke ikinci kilit.
*/
create or replace function private.gorev_anahtari()
returns text
language sql
stable
security definer
set search_path = private
as $$ select deger from private.gorev_ayarlari where anahtar = 'gorev_anahtari' $$;

revoke execute on function private.gorev_anahtari() from public, anon, authenticated;

/* -------------------------------------------------- görünürlük --- */

/*
  Arızanın asıl dersi, anahtarın yanlış yerde durması değil: BEŞ AY boyunca
  hiçbir yerde görünmemesi.

  cron.job_run_details "succeeded" yazıyor, çünkü net.http_post'un kendisi
  başarılı — istek gönderildi. Cevabın 401 olduğunu yalnızca
  net._http_response biliyor ve oraya kimse bakmıyor. Üst üste iki katman,
  ikisi de doğru söylüyor, sonuç yanlış.

  Bu fonksiyon o iki dünyayı tanılama ekranına taşıyor. Görev bazında
  eşleştirme YAPILMIYOR: cron kaydı ile HTTP cevabı arasında güvenilir bir bağ
  yok ve uydurmanın anlamı yok. Toplam yeterli — hepsi düşüyorsa bakılır.
*/
create or replace function public.gorev_sagligi()
returns table (toplam integer, basarili integer, basarisiz integer, son_durum integer, son_zaman timestamptz)
language sql
security definer
set search_path = public, net
as $$
  select
    count(*)::int,
    count(*) filter (where status_code between 200 and 299)::int,
    count(*) filter (where status_code is null or status_code >= 400)::int,
    (select r2.status_code from net._http_response r2 order by r2.created desc limit 1),
    (select r2.created from net._http_response r2 order by r2.created desc limit 1)
  from net._http_response r
  where r.created > now() - interval '24 hours';
$$;

/*
  anon'a kapalı, oturum açmışa açık — ama fonksiyon yalnızca sayı döndürüyor
  ve içerik taşımıyor. Yine de tanılama ekranı is_admin() arkasında.
*/
revoke execute on function public.gorev_sagligi() from public, anon;

/* ---------------------------------------------- görevlerin yeni hâli --- */

/*
  Üç HTTP görevi de yeni okuyucuya çevriliyor.

  cron.alter_job kullanılıyor, unschedule + schedule değil: iş kimliği ve
  çalışma geçmişi korunuyor.
*/
select cron.alter_job(
  (select jobid from cron.job where jobname = 'egitim-hatirlatma'),
  command := $cmd$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/egitim-hatirlatma',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', private.gorev_anahtari()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $cmd$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'odeme-mutabakat'),
  command := $cmd$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/odeme-mutabakat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', private.gorev_anahtari()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);

select cron.alter_job(
  (select jobid from cron.job where jobname = 'meta-kuyruk'),
  command := $cmd$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/meta-kuyruk',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', private.gorev_anahtari()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cmd$
);
