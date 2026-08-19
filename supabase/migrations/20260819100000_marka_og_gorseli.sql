-- Paylaşım görseli (OpenGraph) panelden yönetiliyor.
--
-- Önce depodaki sabit bir PNG kullanılıyordu. Marka görseli değiştiğinde
-- dosyayı yeniden üretip dağıtım yapmak gerekiyordu; logo ve favicon zaten
-- panelden yüklenirken bunun kodda kalması tutarsızdı.
--
-- Boş bırakılabilir: o durumda hiç og:image basılmıyor. Yanlış bir görselle
-- paylaşılmaktansa görselsiz paylaşılmak daha iyi.

alter table public.marka
  add column if not exists og_gorsel text;

comment on column public.marka.og_gorsel is
  'Sosyal medya paylaşım görseli (og:image). marka kovasındaki dosya yolu. 1200x630 PNG/JPG. Boşsa og:image basılmaz.';
