-- Tanıtım sayfalarının arama motoru başlığı ve açıklaması.
--
-- Bugüne kadar bunlar KODUN İÇİNDE yazılıydı (her sayfanın generateMetadata
-- fonksiyonunda). Bir açıklamayı değiştirmek yeni bir dağıtım gerektiriyordu;
-- taşımanın hemen ardından, Search Console'a bakıp başlık deneyeceğiniz
-- dönemde bu en yanlış yerde duran sürtünmeydi.
--
-- Tablo YALNIZCA ELLE EZME taşıyor: bir satır yoksa ya da alanı boşsa sayfa
-- kodda yazan otomatik değerini kullanmaya devam ediyor. Yani bu tablo boşken
-- sitenin davranışı bugünküyle birebir aynı.
--
-- Eğitim sayfaları BURADA DEĞİL: onların SEO alanları courses.content JSON'una
-- yazılıyor. Sebebi, eğitimin adresi (slug) panelden değiştirilebiliyor olması
-- — burada tutulsaydı adres değişince satır sahipsiz kalır, SEO metni sessizce
-- kaybolurdu. content ile birlikte taşındığı için o risk yok.

create table if not exists public.sayfa_seo (
  -- Sitedeki yol: "/", "/hakkimizda" gibi. Sondaki eğik çizgi YOK; uygulama
  -- da bu biçimde soruyor (bkz. src/lib/sayfa-seo.ts).
  yol text primary key,
  -- Boş metin ile NULL aynı anlama geliyor: "doldurulmadı, otomatiği kullan".
  -- Uygulama tarafında ikisi de aynı yere düşüyor.
  baslik text,
  aciklama text,
  updated_at timestamptz not null default now()
);

comment on table public.sayfa_seo is
  'Tanıtım sayfalarının SEO başlığı/açıklaması için elle ezme. Satır yoksa veya alan boşsa sayfa koddaki otomatik değerini kullanır. Eğitim sayfaları burada değil: onlar courses.content içinde.';

-- Yol biçimi kısıtı: "/" ile başlamalı, sonunda çizgi olmamalı, boşluk
-- içermemeli. Elle bir satır eklenirken "/hakkimizda/" yazılırsa uygulama onu
-- hiç bulamaz ve neden çalışmadığı anlaşılmaz; kısıt bunu baştan engelliyor.
alter table public.sayfa_seo drop constraint if exists sayfa_seo_yol_bicimi;
alter table public.sayfa_seo add constraint sayfa_seo_yol_bicimi
  check (yol = '/' or (yol ~ '^/[^/\s]+(/[^/\s]+)*$'));

alter table public.sayfa_seo enable row level security;

-- Okuma herkese açık: metinler zaten sayfanın <head>'inde herkese basılıyor.
create policy sayfa_seo_public_read on public.sayfa_seo
  for select to anon, authenticated using (true);

create policy sayfa_seo_admin_insert on public.sayfa_seo
  for insert to authenticated with check (public.is_admin());
create policy sayfa_seo_admin_update on public.sayfa_seo
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sayfa_seo_admin_delete on public.sayfa_seo
  for delete to authenticated using (public.is_admin());
