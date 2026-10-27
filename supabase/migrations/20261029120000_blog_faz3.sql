-- Blog Faz 3: SEO paneli ve kapak seçimi için yazı alanları.
--
-- Tekrar çalıştırılabilir (if not exists / drop if exists). Mevcut kodla
-- uyumlu: yeni kolonların hepsi boş/varsayılanlı, eski kod okumuyor.

-- Odak kelime: editördeki SEO analizinin dayanağı. Başka yazıda aynı odak
-- kelime varsa panel uyarıyor (aynı aramada yazılar birbiriyle yarışmasın).
alter table public.posts add column if not exists odak_kelime text not null default '';

-- Görselsiz kapağın yazıya özel rengi ve simgesi (lib/blog-kapak). Boşsa
-- kategorinin görünümü. Biçim denetimi kaba: geçersiz değer sitede zaten
-- yok sayılıyor, burada yalnız rastgele metnin girmesi engelleniyor.
alter table public.posts add column if not exists kapak_ton text;
alter table public.posts add column if not exists kapak_simge text;
alter table public.posts drop constraint if exists posts_kapak_ton_bicim;
alter table public.posts
  add constraint posts_kapak_ton_bicim check (kapak_ton is null or kapak_ton ~ '^[a-z][a-z-]{1,29}$');
alter table public.posts drop constraint if exists posts_kapak_simge_bicim;
alter table public.posts
  add constraint posts_kapak_simge_bicim check (kapak_simge is null or kapak_simge ~ '^[a-z][a-z-]{1,29}$');

-- Kapak görselinin açıklaması (alt metni). Önceden kapak <img>'si yazı
-- başlığını alt metin olarak kullanıyordu; görsel başlığı tekrar etmiyorsa
-- (ör. ekran görüntüsü) gerçek açıklama yazılabilsin.
alter table public.posts add column if not exists kapak_alt text not null default '';

create index if not exists posts_odak_kelime_idx on public.posts (lower(odak_kelime)) where odak_kelime <> '';
