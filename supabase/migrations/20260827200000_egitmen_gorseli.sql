-- Eğitmen portresi.
--
-- Bugüne kadar eğitim sayfasındaki eğitmen kutusunda kesikli çerçeveli bir yer
-- tutucu duruyordu ("eğitmen portresi") — arkasında ne bir sütun ne de bir
-- yükleme yolu vardı, yani doldurulması mümkün değildi.
--
-- Dosya kapaklar kovasında `egitmen/` önekiyle duruyor: kova zaten herkese
-- açık ve görsel türleriyle sınırlı, portre için ayrı bir kova açmak aynı
-- kuralları bir kez daha yazmak olurdu. Sütun yolu saklıyor, tam adresi değil;
-- proje adresi değişirse kayıtların hepsi tek yerden düzeliyor (bkz. kapakUrl).

alter table public.site_icerik add column if not exists egitmen_gorsel text;

comment on column public.site_icerik.egitmen_gorsel is
  'kapaklar kovasındaki portre dosyasının yolu (egitmen/...). Boşsa baş harfler gösteriliyor.';
