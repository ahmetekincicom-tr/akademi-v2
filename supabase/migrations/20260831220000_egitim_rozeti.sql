-- Eğitim hero'sundaki güven rozeti.
--
-- Metin panelden yönetiliyor, kodda sabit değil: bir ödül iddiası zamanla
-- değişir (yeni bir ödül, düzeltilmesi gereken bir ifade) ve o an kod
-- değişikliği beklemek istenmez. Aynı sebeple kapatılabilir olması gerekiyor.
--
-- Duyuru ile aynı tabloda çünkü ikisi de "tüm eğitim sayfalarında görünen tek
-- satırlık metin"; ayrı bir tablo aynı kuralları bir kez daha yazmak olurdu.

alter table public.site_icerik
  add column if not exists rozet_metni text,
  add column if not exists rozet_aktif boolean not null default false;

comment on column public.site_icerik.rozet_metni is
  'Eğitim hero''sunda başlığın üstünde görünen rozet metni (örn. "TRT Ödüllü Uzmandan").';
comment on column public.site_icerik.rozet_aktif is
  'Rozet gösterilsin mi. Metin doluyken bile kapatılabilir.';
