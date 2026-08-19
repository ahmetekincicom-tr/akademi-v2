-- Paylaşım görselinin ölçüleri.
--
-- og:image tek başına yetmiyor: WhatsApp ve bazı istemciler görseli indirmeden
-- önce boyutunu bilmek istiyor ve og:image:width / og:image:height yoksa
-- görseli hiç çekmeden kartı yazıyla basıyor. Ölçüler yükleme anında
-- tarayıcıda okunup buraya yazılıyor; sunucuda her istekte görseli indirip
-- ölçmek anlamsız bir maliyet olurdu.

alter table public.marka
  add column if not exists og_genislik smallint,
  add column if not exists og_yukseklik smallint;

comment on column public.marka.og_genislik is
  'Paylaşım görselinin piksel genişliği. og:image:width olarak basılıyor.';
comment on column public.marka.og_yukseklik is
  'Paylaşım görselinin piksel yüksekliği. og:image:height olarak basılıyor.';

update public.marka
set og_genislik = 1200, og_yukseklik = 630
where id and og_gorsel is not null and og_genislik is null;
