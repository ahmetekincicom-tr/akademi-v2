-- Kategori arşiv sayfaları için giriş metni. Boşken sayfa yalnız başlık ve
-- yazı kartlarından oluşuyordu (SEO denetimi: ince içerik). Aynı metin meta
-- açıklaması olarak da kullanılıyor.
alter table public.categories add column if not exists aciklama text not null default '';
comment on column public.categories.aciklama is 'Kategori arşiv sayfasının giriş metni ve meta açıklaması.';
