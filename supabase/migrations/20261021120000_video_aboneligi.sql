-- Video aboneliği.
--
-- Ders videoları aylık abonelikle açılıyor: eğitime KAYITLI olan ve aboneliği
-- SÜRESİ İÇİNDE olan katılımcı izliyor. Kayıt bugünkü gibi yönetimden
-- yapılıyor; abonelik kaydın yerine geçmiyor, üstüne bir şart ekliyor.
--
-- Birebir seans kayıtları bu kuralın DIŞINDA: kişi o eğitimin ücretini
-- ödemiş, kendi seansının kaydı ücretsiz kalıyor (egitim_oturumlari,
-- egitim_kayit_arsivi — bu dosya onlara dokunmuyor).
--
-- Tahsilat iyzico'nun abonelik ürününde. Kart bilgisi ve her ayki çekim
-- iyzico'da; burada yalnızca iyzico'nun söylediğinin kopyası duruyor. Kopya
-- hiçbir zaman gelen bildirimin GÖVDESİNDEN yazılmıyor, iyzico'ya tekrar
-- sorularak yazılıyor (src/lib/abonelik.ts).

create type public.abonelik_durum as enum (
  -- Ödeme formu açıldı, sonuç henüz yok.
  'bekliyor',
  'aktif',
  -- Yenileme çekimi reddedildi; ek süre boyunca izleme açık kalıyor.
  'odeme_alinamadi',
  -- Kişi ya da yönetici iptal etti; ödenmiş dönemin sonuna kadar izleyebilir.
  'iptal',
  'sona_erdi',
  -- İlk ödeme hiç geçmedi.
  'basarisiz'
);

create table public.abonelikler (
  id uuid primary key default gen_random_uuid(),
  -- profiles'a bağlı: yönetim listesi ad ve e-postayı tek sorguda çekiyor.
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- 'yonetici': iyzico'suz, yönetimin elle tanıdığı süre (hediye, telafi).
  kaynak text not null default 'iyzico' check (kaynak in ('iyzico', 'yonetici')),
  durum public.abonelik_durum not null default 'bekliyor',

  /*
    İzlemenin açık olduğu son an. Erişim kararının TEK girdisi bu.

    Durumdan ayrı tutuluyor çünkü ikisi aynı şeyi söylemiyor: iptal edilmiş
    bir abonelik ödenmiş ayın sonuna kadar açık, reddedilmiş bir yenileme ek
    süre boyunca açık. Kararı her yerde durumdan yeniden türetmek, kuralın
    üç ayrı yerde üç farklı yorumu demekti.
  */
  erisim_bitis timestamptz,
  -- Son BAŞARILI çekimin kapsadığı dönem.
  donem_baslangic timestamptz,
  donem_bitis timestamptz,
  tutar numeric(10, 2),

  iyzico_abonelik_kodu text unique,
  iyzico_musteri_kodu text,
  iyzico_plan_kodu text,
  -- Ödeme formunun dönüşünü bu satırla eşleştiren iki anahtar.
  conversation_id text unique,
  token text unique,
  -- iyzico test ortamında açıldıysa sonraki sorgular da oraya gidiyor.
  test_modu boolean not null default false,

  iptal_tarihi timestamptz,
  son_hata text,
  admin_notu text,
  ham_yanit jsonb,
  callback_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index abonelikler_user_idx on public.abonelikler (user_id, erisim_bitis desc);
create index abonelikler_durum_idx on public.abonelikler (durum);

comment on table public.abonelikler is
  'Video aboneliği. iyzico satırlarını yalnızca sunucu (servis anahtarı) yazar; yönetici elle süre tanıyabilir.';

/*
  Abonelik olayları: her çekim, her ret, her iptal.

  Kayıt defteri olmasının yanında bir kilit: aynı çekim için ikinci kez satır
  yazılamıyor (benzersiz indeks), dolayısıyla aynı "ödemen alındı" maili iki
  kez gitmiyor. iyzico bildirimi tekrarlayabiliyor, mutabakat görevi aynı
  aboneliğe tekrar bakıyor — çift mail ihtimali gerçek.
*/
create table public.abonelik_olaylari (
  id uuid primary key default gen_random_uuid(),
  abonelik_id uuid not null references public.abonelikler(id) on delete cascade,
  olay text not null,
  iyzico_siparis_kodu text,
  ayrinti jsonb,
  created_at timestamptz not null default now()
);

-- Kısmi (WHERE ...) değil: PostgREST'in "çakışırsa atla" yazımı kısmi indeksi
-- tanımıyor. NULL'lar zaten birbirinden farklı sayıldığı için siparişsiz
-- olaylar (elle not gibi) bu kilide takılmıyor.
create unique index abonelik_olaylari_tekil_idx
  on public.abonelik_olaylari (abonelik_id, olay, iyzico_siparis_kodu);
create index abonelik_olaylari_abonelik_idx on public.abonelik_olaylari (abonelik_id, created_at desc);

alter table public.abonelikler enable row level security;
alter table public.abonelik_olaylari enable row level security;

-- Kişi kendi aboneliğini görür; yazamaz. Durumu iyzico belirliyor, tarayıcı
-- değil — öğrencinin "erisim_bitis = 2099" yazabildiği bir tablo olmamalı.
create policy abonelikler_select_own_or_admin on public.abonelikler
  for select using (user_id = auth.uid() or public.is_admin());
create policy abonelikler_admin_insert on public.abonelikler
  for insert with check (public.is_admin());
create policy abonelikler_admin_update on public.abonelikler
  for update using (public.is_admin());
create policy abonelikler_admin_delete on public.abonelikler
  for delete using (public.is_admin());

create policy abonelik_olaylari_admin_select on public.abonelik_olaylari
  for select using (public.is_admin());

/* --------------------------------------------------------- erişim --- */

-- security definer: politikalar ve aşağıdaki fonksiyonlar bunu çağırıyor;
-- is_enrolled ile aynı gerekçe.
create or replace function public.abonelik_aktif()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.abonelikler
    where user_id = auth.uid()
      and erisim_bitis > now()
  );
$$;

revoke execute on function public.abonelik_aktif() from public, anon;
grant execute on function public.abonelik_aktif() to authenticated;

/*
  Ders videolarının kimliği artık yalnızca bu iki fonksiyondan okunuyor.

  Önceki durum: lessons satırları "yayındaki eğitim" için oturum açmış HERKESE
  okunur ve video_url de o satırın bir kolonu. Kayıtlı olmayan biri
  REST üzerinden bütün video kimliklerini çekebiliyordu. Abonelikle birlikte
  bu, ücretli içeriğin ücretsiz okunması demek.

  Kolon bazlı yetki: tablo yetkisi geri alınıp yalnızca gösterilen kolonlar
  veriliyor (20260815200000_anon_erisim_daraltma.sql'deki dersin aynısı —
  tablo yetkisi dururken kolon revoke'u sessizce etkisiz kalıyor).

  UPDATE yetkisi DURUYOR: yönetim video kimliğini yazmaya devam ediyor, sadece
  okuması fonksiyondan.
*/
revoke select on public.lessons from authenticated;
grant select (id, module_id, sira, baslik, sure, aciklama) on public.lessons to authenticated;

-- Katılımcı: kayıtlı olduğu eğitimlerin videoları, aboneliği sürüyorsa.
-- Yönetici kendi paneline önizleme için girdiğinde de görüyor.
create or replace function public.ders_videolarim()
returns table (lesson_id uuid, video_url text)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.video_url
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where l.video_url is not null
    and public.is_enrolled(m.course_id)
    and (public.abonelik_aktif() or public.is_admin());
$$;

revoke execute on function public.ders_videolarim() from public, anon;
grant execute on function public.ders_videolarim() to authenticated;

-- Yönetim: bütün video kimlikleri (video kütüphanesi ekranı).
create or replace function public.yonetici_ders_videolari()
returns table (lesson_id uuid, video_url text)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.video_url
  from public.lessons l
  where public.is_admin();
$$;

revoke execute on function public.yonetici_ders_videolari() from public, anon;
grant execute on function public.yonetici_ders_videolari() to authenticated;

-- Yan menüdeki "videosu girilmemiş ders" sayacı. Filtre kolonu okumayı
-- gerektirdiği için o da artık doğrudan sorgulanamıyor.
create or replace function public.videosuz_ders_sayisi()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin()
    then (select count(*)::int from public.lessons where video_url is null)
    else 0
  end;
$$;

revoke execute on function public.videosuz_ders_sayisi() from public, anon;
grant execute on function public.videosuz_ders_sayisi() to authenticated;

/* ---------------------------------------------------------- ayarlar --- */

/*
  Kapalı başlıyor ve test modunda. Test modundayken abonelik yalnızca
  yöneticiye görünüyor ve iyzico'nun test ortamına gidiyor: canlı sitede,
  gerçek katılımcılar bir şey görmeden uçtan uca denenebiliyor.
*/
insert into public.settings (anahtar, deger)
values (
  'abonelik',
  '{"acik": false, "testModu": true, "planKodu": "", "testPlanKodu": "", "fiyat": 0, "ekSureGun": 3}'::jsonb
)
on conflict (anahtar) do nothing;

/* ------------------------------------------------------ zamanlayıcı --- */

/*
  Abonelik mutabakatı, saatte bir.

  Asıl yol iyzico'nun bildirimi; bu görev onun kaybolduğu günler için.
  İki şeye bakıyor: dönüşü gelmemiş ödeme formları ve dönem sonu geçmiş ama
  yenilemesi henüz işlenmemiş abonelikler.
*/
select cron.unschedule('abonelik-mutabakat')
where exists (select 1 from cron.job where jobname = 'abonelik-mutabakat');

select cron.schedule(
  'abonelik-mutabakat',
  '50 * * * *',
  $$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/abonelik-mutabakat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', private.gorev_anahtari()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
