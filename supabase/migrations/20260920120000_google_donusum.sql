-- Google Ads dönüşüm atıfı (Enhanced Conversions "A" hattı — GA4 Measurement
-- Protocol üzerinden, Google Ads API'siz).
--
-- Meta tarafı zaten çalışıyor: reklamdan gelen tıklama (fbp/fbc) temas kodu ile
-- profile bağlanıyor, satın alma sunucudan CAPI'ye gidiyor. Google tarafında
-- karşılığı yoktu. Bu göç o boşluğu dolduruyor:
--
--  1. Reklam tıklamasının Google kimlikleri (gclid + GA client_id) temasla
--     birlikte yakalanıp, temas kodu kişiye bağlanınca profile taşınıyor.
--  2. Eğitim kaydı (ödeme) kesinleşince sunucu GA4'e bir "purchase" olayı
--     gönderiyor (Measurement Protocol); GA4'te anahtar olay işaretlenip
--     Google Ads'e içe aktarılıyor.
--  3. Her gönderim google_donusumleri'nde loglanıyor — panelde "reklamdan gelen
--     dönüşümler" listesi buradan besleniyor.

-- Tıklamanın Google kimlikleri: temasta ve (bağlanınca) profilde.
alter table public.temaslar add column if not exists gclid text;
alter table public.temaslar add column if not exists ga_client_id text;
alter table public.profiles add column if not exists gclid text;
alter table public.profiles add column if not exists ga_client_id text;

comment on column public.profiles.gclid is 'Google Ads tık kimliği (reklamdan gelen kayıtları Google''a bildirmek için).';
comment on column public.profiles.ga_client_id is 'GA4 client_id; Measurement Protocol dönüşümünü doğru oturuma bağlamak için.';

-- Dönüşüm günlüğü: her eğitim kaydının Google''a bildirimi.
create table if not exists public.google_donusumleri (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  tutar numeric,
  para_birimi text not null default 'TRY',
  gclid text,
  ga_client_id text,
  kaynak text,
  -- bekliyor | gonderildi | basarisiz | atlandi (atıf bilgisi yok)
  durum text not null default 'bekliyor',
  http_kod integer,
  hata text,
  olay_zamani timestamptz not null default now(),
  gonderim_zamani timestamptz,
  created_at timestamptz not null default now(),
  -- Aynı ödeme iki kez çözülse de (geri tuşu, mutabakat) tek satır.
  unique (payment_id)
);

create index if not exists google_donusumleri_durum_idx on public.google_donusumleri (durum);
create index if not exists google_donusumleri_olusturma_idx on public.google_donusumleri (created_at desc);

alter table public.google_donusumleri enable row level security;

-- Yalnızca yönetici okuyabilir; yazma service_role ile (RLS'i aşar), tıpkı
-- meta_olaylari gibi.
drop policy if exists google_donusumleri_admin_select on public.google_donusumleri;
create policy google_donusumleri_admin_select on public.google_donusumleri
  for select using (public.is_admin());
