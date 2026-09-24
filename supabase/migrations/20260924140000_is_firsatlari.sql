-- İş ilanları / fırsatlar (faz 1: yalnız yönetici ilan girer).
--
-- Üç tablo:
--   is_ilanlari        ilanın kendisi
--   is_ilani_kayitlar  öğrencinin "Kaydet" dediği ilanlar (favoriler)
--   is_ilani_olaylar   görüntülenme ve başvuru TIKLAMASI
--
-- Başvuru dışarıda (şirketin adresi ya da e-postası) yapılıyor; gerçekten
-- başvurulup başvurulmadığını bilmiyoruz. Bu yüzden metrik "başvuru" değil
-- "başvuru tıklaması".
--
-- "Süresi doldu" iki yoldan oluyor: yönetici durumu elle 'sona_erdi' yapar ya
-- da son başvuru tarihi geçer (Türkiye günü). İkincisi bir zamanlayıcı
-- beklemeden, okuma anında hesaplanıyor (bkz. is_ilani_suresi_doldu).

create table if not exists public.is_ilanlari (
  id uuid primary key default gen_random_uuid(),
  pozisyon text not null check (length(trim(pozisyon)) between 2 and 120),
  sirket_adi text not null check (length(trim(sirket_adi)) between 1 and 120),
  -- "logolar" kovasındaki yol (açık kova, /dosya/logolar/... üzerinden).
  sirket_logo text,
  sirket_web text,
  kategori text not null default 'Genel',
  calisma_tipi text not null check (calisma_tipi in ('tam_zamanli', 'yari_zamanli', 'freelance', 'staj')),
  calisma_modeli text not null check (calisma_modeli in ('ofis', 'hibrit', 'uzaktan')),
  sehir text,
  seviye text not null default 'fark_etmez'
    check (seviye in ('giris', 'orta', 'kidemli', 'yonetici', 'fark_etmez')),
  aciklama text not null default '',
  sorumluluklar text[] not null default '{}',
  aranan_ozellikler text[] not null default '{}',
  tercihen_ozellikler text[] not null default '{}',
  -- Serbest metin: "45.000–55.000 TL net / ay" gibi. Yoksa boş bırakılır.
  ucret text,
  basvuru_tipi text not null check (basvuru_tipi in ('url', 'eposta')),
  basvuru_adresi text not null,
  -- Bu günün SONUNA kadar başvuru açık (Türkiye saati).
  son_basvuru date,
  durum text not null default 'taslak' check (durum in ('taslak', 'yayinda', 'sona_erdi', 'arsiv')),
  one_cikan boolean not null default false,
  yayin_tarihi timestamptz,
  olusturan uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint is_ilani_basvuru_adresi check (
    (basvuru_tipi = 'url' and basvuru_adresi ~* '^https?://[^\s]+$')
    or (basvuru_tipi = 'eposta' and basvuru_adresi ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
  ),
  -- Ofis ve hibrit için şehir şart; uzaktan için isteğe bağlı.
  constraint is_ilani_sehir check (calisma_modeli = 'uzaktan' or length(trim(coalesce(sehir, ''))) > 0)
);

comment on table public.is_ilanlari is 'İş ilanları / fırsatlar. Faz 1: yalnız yönetici girer.';

create index if not exists is_ilanlari_liste_idx
  on public.is_ilanlari (one_cikan desc, yayin_tarihi desc)
  where durum in ('yayinda', 'sona_erdi');

create or replace function public.is_ilani_damga()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  -- Yayına ilk alındığı an damgalanıyor; sonraki düzenlemeler tarihi öne çekmiyor.
  if new.durum = 'yayinda' and new.yayin_tarihi is null then
    new.yayin_tarihi = now();
  end if;
  return new;
end;
$$;

drop trigger if exists is_ilani_damga on public.is_ilanlari;
create trigger is_ilani_damga before insert or update on public.is_ilanlari
  for each row execute function public.is_ilani_damga();

-- Başvuru kapalı mı: elle sona erdirilmiş ya da son gün geçmiş.
create or replace function public.is_ilani_suresi_doldu(i public.is_ilanlari)
returns boolean language sql stable as $$
  select i.durum = 'sona_erdi'
    or (i.son_basvuru is not null and i.son_basvuru < (now() at time zone 'Europe/Istanbul')::date);
$$;

alter table public.is_ilanlari enable row level security;

-- Öğrenci: yalnız yayındaki (ve süresi dolmuş olarak işaretlenmiş) ilanlar.
-- Taslak ve arşiv yalnız yöneticide.
drop policy if exists "ilanlar okunur" on public.is_ilanlari;
create policy "ilanlar okunur" on public.is_ilanlari
  for select to authenticated
  using (durum in ('yayinda', 'sona_erdi') or (select public.is_admin()));

drop policy if exists "ilanlari yonetici yonetir" on public.is_ilanlari;
create policy "ilanlari yonetici yonetir" on public.is_ilanlari
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.is_ilanlari to authenticated;

-- Kaydedilen ilanlar ----------------------------------------------------------

create table if not exists public.is_ilani_kayitlar (
  user_id uuid not null references public.profiles (id) on delete cascade,
  ilan_id uuid not null references public.is_ilanlari (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ilan_id)
);

create index if not exists is_ilani_kayitlar_ilan_idx on public.is_ilani_kayitlar (ilan_id);

alter table public.is_ilani_kayitlar enable row level security;

drop policy if exists "kayitlar kendi veya yonetici" on public.is_ilani_kayitlar;
create policy "kayitlar kendi veya yonetici" on public.is_ilani_kayitlar
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Yalnız görebildiği (yayındaki) ilanı kaydedebilir.
drop policy if exists "kayit ekle" on public.is_ilani_kayitlar;
create policy "kayit ekle" on public.is_ilani_kayitlar
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.is_ilanlari i where i.id = ilan_id and i.durum in ('yayinda', 'sona_erdi'))
  );

drop policy if exists "kayit sil" on public.is_ilani_kayitlar;
create policy "kayit sil" on public.is_ilani_kayitlar
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.is_ilani_kayitlar to authenticated;

-- Olaylar: görüntülenme ve başvuru tıklaması ------------------------------------
--
-- Kişi başına GÜNDE bir kez sayılıyor (benzersiz indeks): sayfayı yenilemek ya
-- da düğmeye art arda basmak sayıyı şişirmesin. Yönetici olayları uygulama
-- tarafında hiç yazılmıyor (önizleme metriği bozmasın).

create table if not exists public.is_ilani_olaylar (
  id bigint generated always as identity primary key,
  ilan_id uuid not null references public.is_ilanlari (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tur text not null check (tur in ('goruntulenme', 'basvuru_tiklama')),
  gun date not null default ((now() at time zone 'Europe/Istanbul')::date),
  created_at timestamptz not null default now()
);

create unique index if not exists is_ilani_olaylar_gunluk
  on public.is_ilani_olaylar (ilan_id, user_id, tur, gun);

alter table public.is_ilani_olaylar enable row level security;

drop policy if exists "olay yaz" on public.is_ilani_olaylar;
create policy "olay yaz" on public.is_ilani_olaylar
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and gun = (now() at time zone 'Europe/Istanbul')::date
    and exists (
      select 1 from public.is_ilanlari i
      where i.id = ilan_id
        and i.durum in ('yayinda', 'sona_erdi')
        -- Süresi dolmuş ilanda başvuru tıklaması olmaz.
        and (tur = 'goruntulenme' or not public.is_ilani_suresi_doldu(i))
    )
  );

drop policy if exists "olaylari yonetici okur" on public.is_ilani_olaylar;
create policy "olaylari yonetici okur" on public.is_ilani_olaylar
  for select to authenticated
  using ((select public.is_admin()));

grant select, insert on public.is_ilani_olaylar to authenticated;

-- Yönetim ekranı için ilan başına sayılar. security_invoker: RLS çağıranınkine
-- göre çalışır — öğrenci sorgularsa olay satırlarını göremediği için sıfır görür.
create or replace view public.is_ilani_metrikleri
with (security_invoker = true) as
select
  i.id as ilan_id,
  (select count(*) from public.is_ilani_olaylar o where o.ilan_id = i.id and o.tur = 'goruntulenme')::int as goruntulenme,
  (select count(*) from public.is_ilani_olaylar o where o.ilan_id = i.id and o.tur = 'basvuru_tiklama')::int as basvuru_tiklama,
  (select count(*) from public.is_ilani_kayitlar k where k.ilan_id = i.id)::int as kayit
from public.is_ilanlari i;

grant select on public.is_ilani_metrikleri to authenticated;
