-- Meta (Facebook) Conversions API altyapısı.
--
-- Bu funnel'da satın alma tarayıcıda GERÇEKLEŞMİYOR: kişi reklamı görüyor,
-- WhatsApp'tan yazıyor ya da form dolduruyor, telefonla konuşuluyor, hesabı
-- elle açılıyor ve ödeme günler sonra panelin içinde — bazen havaleyle, yani
-- hiçbir tarayıcı olmadan — tamamlanıyor.
--
-- Tarayıcı pixel'i bunların hiçbirini göremez. Görebilen tek şey sunucu, ve
-- sunucunun görebilmesi için tıklama anındaki kimliğin ödeme gününe kadar
-- saklanması gerekiyor. Bu migration o saklamayı kuruyor.

/* ------------------------------------------------------------ temaslar --- */

/*
  İlk temas kaydı.

  Kişi WhatsApp'a ya da dışarı çıkan bir bağlantıya tıkladığı anda, HÂLÂ bizim
  alan adımızdayken yazılıyor: Meta'nın çerezleri (_fbp, _fbc), IP ve tarayıcı
  kimliği burada donuyor.

  Neden çereze güvenmiyoruz: Safari'nin ITP'si JavaScript'in yazdığı çerezlere
  7 günlük ömür biçiyor. Tıklama ile ödeme arasında haftalar olabildiği için
  o çerez ödeme gününe kadar yaşamaz. Buradaki satır yaşar.

  `kod` WhatsApp mesajına gömülen kısa referans: konuşmada geri döndüğünde
  yöneticinin hesabı açarken yapıştırdığı şey o. Tıklamayı kişiye bağlayan
  tek köprü.
*/
create table public.temaslar (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique,
  /* Hangi düğme: footer, iletisim, wp-header ... Hangi yerleşimin çalıştığı. */
  yer text,
  /* Nereye gitti (whatsapp numarası gibi). */
  hedef text,
  fbp text,
  fbc text,
  ip inet,
  ua text,
  referrer text,
  /*
    Tıklama anında reklam izni var mıydı?

    İzinsiz temas da kaydediliyor — kayıt bizim defterimiz, Meta'ya gönderim
    değil. Gönderim kararı bu alana bakıyor: izin yoksa olay kuyruğa hiç
    girmiyor.
  */
  izin boolean not null default false,
  /* Yönetici kodu bir kişiye bağladığında dolar. */
  user_id uuid references auth.users on delete set null,
  eslesme_zamani timestamptz,
  created_at timestamptz not null default now()
);

create index temaslar_created_at_idx on public.temaslar (created_at desc);

comment on table public.temaslar is
  'Dışarı çıkan tıklamaların ilk temas kaydı: Meta çerezleri, IP ve kısa referans kodu. Ödeme günler sonra geldiğinde reklama bağlanabilmesi buradan yürüyor.';

alter table public.temaslar enable row level security;

/*
  Yazma yalnızca servis anahtarıyla (yönlendirme ucu), okuma yalnızca
  yöneticide. anon'a insert verilseydi herkese açık bir yazma ucu olurdu ve
  tablo tek bir betikle şişirilebilirdi.
*/
create policy temaslar_admin_all on public.temaslar
  for all using (is_admin()) with check (is_admin());

/* ------------------------------------------------------- olay kuyruğu --- */

/*
  Meta'ya gidecek olayların kuyruğu.

  Neden kuyruk, neden doğrudan gönderim değil: olayları üreten akışların
  hepsi (ödeme onayı, form kaydı) Meta'dan çok daha önemli bir işi yeni
  bitirmiş oluyor. Meta yavaşladığında ya da 500 döndüğünde ödeme akışının
  beklemesi kabul edilemez. Satır yazılıyor, gönderimi zamanlayıcı yapıyor.

  Yan faydası: başarısız gönderim GÖRÜNÜR ve tekrar denenebilir oluyor —
  e-posta günlüğünde olduğu gibi.
*/
create table public.meta_olaylari (
  id uuid primary key default gen_random_uuid(),
  /* Meta'nın standart olay adı: Purchase, Lead, Contact ... */
  olay text not null,
  /*
    Tekilleştirme anahtarı. Meta aynı event_id'yi ikinci kez saymıyor.

    Deterministik üretiliyor (purchase-<payment_id> gibi), o yüzden buradaki
    unique kısıt aynı zamanda bizim tarafımızın idempotency'si: aynı ödeme
    iki kez kuyruğa girmeye çalışırsa insert çakışıyor ve ikincisi düşüyor.
  */
  event_id text not null unique,
  olay_zamani timestamptz not null default now(),
  kaynak_url text,
  /* Hash'lenmiş kimlik + fbp/fbc/ip/ua. Ham e-posta ASLA yazılmıyor. */
  kimlik jsonb not null default '{}'::jsonb,
  /* value, currency, content_name ... */
  ozel jsonb not null default '{}'::jsonb,
  /*
    Meta'nın action_source'u: olayın GERÇEKTE nerede olduğu.

    Havaleyle kapanan bir ödeme "website" değil; kişi o an hiçbir sayfada
    değildi. Yanlış yazmak Meta'nın eşleştirmesini bozuyor ve raporda olmayan
    bir site trafiği gösteriyor.
  */
  aksiyon text not null default 'website',
  /*
    'izinsiz': reklam izni olmadığı için gönderilmedi.

    Kuyruğa yine de giriyor. "Neden bu satış Meta'da görünmüyor" sorusunun
    cevabı "çünkü kişi çerez izni vermemişti" ise, o cevabın bir yerde
    durması gerekiyor — yoksa hata aranır.
  */
  durum text not null default 'bekliyor'
    check (durum in ('bekliyor', 'gonderildi', 'basarisiz', 'kapali', 'izinsiz', 'yapilandirilmadi', 'vazgecildi')),
  deneme integer not null default 0,
  sebep text,
  user_id uuid references auth.users on delete set null,
  gonderim_zamani timestamptz,
  created_at timestamptz not null default now()
);

/* Kuyruk sorgusu yalnızca bekleyenlere bakıyor; kısmi indeks tablo büyüdükçe
   de aynı hızda kalmasını sağlıyor. */
create index meta_olaylari_kuyruk_idx on public.meta_olaylari (created_at)
  where durum = 'bekliyor';
create index meta_olaylari_created_at_idx on public.meta_olaylari (created_at desc);

comment on table public.meta_olaylari is
  'Meta Conversions API kuyruğu ve günlüğü. Gönderimi pg_cron yapıyor; akışları bloklamaması için satır yazmakla gönderim ayrıldı.';

alter table public.meta_olaylari enable row level security;

create policy meta_olaylari_admin_all on public.meta_olaylari
  for all using (is_admin()) with check (is_admin());

/* --------------------------------------------------- olay aç / kapa --- */

/*
  Kapatılmış olaylar defteri. eposta_akislari ile birebir aynı desen:
  katalog KODDA duruyor, tablo yalnızca "kapalı olanlar"ı tutuyor.

  Satırı olmayan olay hiç kapatılmamış demek — varsayılan açık.
*/
create table public.meta_akislari (
  anahtar text primary key,
  acik boolean not null default true,
  guncelleme timestamptz not null default now()
);

comment on table public.meta_akislari is
  'Meta olaylarının aç/kapa defteri. Satır yoksa olay açık sayılır.';

alter table public.meta_akislari enable row level security;

create policy meta_akislari_admin_all on public.meta_akislari
  for all using (is_admin()) with check (is_admin());

/* ------------------------------------------------ profildeki kimlik --- */

/*
  Tıklama kimliği kişiye yapıştığı yer.

  Ödeme günler sonra, başka bir oturumda, hatta hiç tarayıcı olmadan
  (havale) geliyor. O anda Meta'ya gönderilecek kimliğin okunacağı tek yer
  burası.
*/
alter table public.profiles
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists ilk_ip inet,
  add column if not exists ilk_ua text,
  add column if not exists temas_kodu text,
  /*
    Çerez bandındaki reklam izni.

    Ödeme günler sonra, bazen havaleyle — yani kişi hiçbir sayfada değilken —
    kapanıyor. O anda okunacak bir çerez yok. İzin kararının bir yerde
    donması gerekiyor, yoksa gecikmeli her olay "izinsiz" sayılırdı ve
    ölçümleme sessizce boş kalırdı.

    null = hiç sorulmamış. false ile arasındaki fark önemli: biri "hayır"
    dedi, diğeri hiç görmedi.
  */
  add column if not exists reklam_izni boolean,
  add column if not exists reklam_izni_tarihi timestamptz,
  /*
    Yöneticinin elle işaretlediği geliş kaynağı. Meta'ya GİTMİYOR; bu bizim
    bağımsız sayımımız. Meta "bu ay 6 satış getirdim" dediğinde ona karşı
    koyacak bir sayı olmazsa o rakam doğrulanamaz.
  */
  add column if not exists kaynak text;

comment on column public.profiles.fbc is
  'Meta tıklama kimliği (fbclid''den türetilir). Tıklama anında yakalanıp buraya kopyalanıyor; çerez Safari''de 7 günde siliniyor, bu satır silinmiyor.';
comment on column public.profiles.kaynak is
  'Yöneticinin işaretlediği geliş kaynağı (reklam, whatsapp, referans, organik, ice-aktarma). Meta''ya gönderilmiyor.';

/* ----------------------------------------------- public pixel görünümü --- */

/*
  Pixel ID'nin ziyaretçiye açılması.

  settings tablosu bütünüyle kapalı ve kapalı kalmalı: `meta` satırının içinde
  CAPI token'ı duruyor. O token'la Meta hesabına olay yazılabiliyor — sızması,
  reklam verisinin bozulması demek.

  Pixel ID ise gizli bilgi değil; zaten sayfa kaynağında görünüyor. Bu yüzden
  olcumleme_ayarlari ile aynı desen: TEK bir alanı adıyla yayınlayan bir
  görünüm. Buraya elle eklenmediği sürece hiçbir yeni alan dışarı çıkmıyor.
*/
create or replace view public.meta_pixel_ayari
with (security_invoker = off) as
select nullif(trim(deger ->> 'pixelId'), '') as pixel_id
from public.settings
where anahtar = 'meta';

comment on view public.meta_pixel_ayari is
  'settings.meta satırından YALNIZCA pixel ID''yi public okumaya açar. capiToken bilerek dışarıda; yeni alan eklerken bunu koru.';

grant select on public.meta_pixel_ayari to anon, authenticated;

/* ------------------------------------------------- saklama süreleri --- */

/*
  90 gün, giriş kayıtları ve e-posta günlüğüyle aynı.

  İkisi de kişisel veri taşıyor: temaslar IP, olaylar hash'lenmiş e-posta ve
  IP. Faydalı oldukları pencere dar — "geçen ay şu olay gitti mi" sorulur,
  "iki yıl önce" sorulmaz. Meta zaten 7 günden eski olayı kabul etmiyor.

  Eşleşmiş temas satırı da siliniyor: kimliği zaten profile kopyalandı, satır
  yalnızca IP taşıyan bir kopya olarak kalıyor.
*/
create or replace function public.eski_meta_kayitlarini_sil()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.meta_olaylari where created_at < now() - interval '90 days';
  delete from public.temaslar where created_at < now() - interval '90 days';
$$;

comment on function public.eski_meta_kayitlarini_sil() is
  'Meta olay kuyruğunun ve temas kayıtlarının 90 günden eski satırlarını siler. pg_cron gecelik çağırıyor.';

/*
  Çağırma yetkisi yalnızca zamanlayıcıda — diğer temizlik fonksiyonlarıyla
  aynı gerekçe: SECURITY DEFINER olduğu için oturum açmış herkese açık
  bırakılsaydı, REST üzerinden çağrılıp günlük budanabilirdi.
*/
revoke execute on function public.eski_meta_kayitlarini_sil() from public, anon, authenticated;

select cron.unschedule('meta-kayit-temizligi')
where exists (select 1 from cron.job where jobname = 'meta-kayit-temizligi');

select cron.schedule('meta-kayit-temizligi', '35 3 * * *', $$ select public.eski_meta_kayitlarini_sil(); $$);

/* --------------------------------------------------- kuyruk görevi --- */

/*
  Kuyruğu boşaltan görev. 5 dakika, eğitim hatırlatmasıyla aynı sıklık:
  Meta olayları taze olduğunda daha iyi eşleşiyor ama saniye hassasiyeti
  gerektiren bir şey değil.

  Adres ve anahtar diğer görevlerle aynı yerden geliyor; alan adı değişirse
  hepsi birlikte güncellenir.
*/
select cron.unschedule('meta-kuyruk')
where exists (select 1 from cron.job where jobname = 'meta-kuyruk');

select cron.schedule(
  'meta-kuyruk',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/meta-kuyruk',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', current_setting('app.gorev_anahtari', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
