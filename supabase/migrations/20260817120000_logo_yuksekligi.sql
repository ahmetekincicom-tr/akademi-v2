-- Logonun ekranda kaplayacağı yükseklik.
--
-- Sabit 36 pikselle çiziliyordu ve yüklenen dosyaya göre bu çok küçük
-- kalabiliyor: bir SVG'nin görsel ağırlığı yalnızca yüksekliğinden değil,
-- viewBox'ının içindeki boşluktan da geliyor. Kenarlarında pay bırakılmış bir
-- dosya, aynı piksel yüksekliğinde gözle görülür biçimde daha küçük duruyor.
-- Bu payı kodda tahmin etmek mümkün değil, o yüzden ayar panele taşınıyor.
--
-- Değer başlıktaki (header) yüksekliği piksel olarak veriyor; alt bilgi ve
-- giriş ekranı bundan oranlanıyor (src/components/site/Logo.tsx).

alter table public.marka
  add column if not exists logo_yuksekligi smallint not null default 40;

comment on column public.marka.logo_yuksekligi is
  'Başlıktaki logo yüksekliği (piksel). Alt bilgi ve giriş ekranı bu değerden oranlanır. Makul aralık 24-72.';

-- Sınırı veritabanı da koruyor: panelde tek bir hatalı giriş bütün sayfaların
-- başlığını bozabilir.
alter table public.marka
  drop constraint if exists marka_logo_yuksekligi_araligi;
alter table public.marka
  add constraint marka_logo_yuksekligi_araligi
  check (logo_yuksekligi between 24 and 72);
