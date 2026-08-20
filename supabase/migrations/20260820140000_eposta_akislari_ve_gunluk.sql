-- E-posta akışlarının anahtarı ve gönderim günlüğü.
--
-- İki ayrı sorunun cevabı:
--
--   "gitti mi?"     → eposta_gunlugu. Şimdiye kadar bunun cevabı yoktu.
--                     Gönderim sonucu yalnızca çağıran yere dönüyordu; o da
--                     çoğunlukla ekranda bir uyarı gösterip unutuyordu. Bir
--                     hafta sonra "şu kişiye mail gitmiş mi" sorusunun
--                     bakılacak bir yeri yoktu.
--
--   "gitmesin"      → eposta_akislari. Tek çare ortam değişkenini silmekti,
--                     o da BÜTÜN mailleri kapatıyordu. Tek bir bildirimi
--                     geçici olarak susturmanın yolu yoktu.
--
-- Akışların listesi (ad, açıklama, kime gittiği) KODDA duruyor, burada değil.
-- Sebep: yeni bir mail eklendiğinde kod zaten değişiyor; katalog da veritabanında
-- olsaydı iki yeri birlikte güncellemek gerekir, biri unutulduğunda akış ya
-- listede görünmez ya da var olmayan bir maile anahtar çıkardı. Bu tablo
-- yalnızca "kapalı olanlar" defteri.

create table if not exists public.eposta_akislari (
  anahtar text primary key,
  acik boolean not null default true,
  -- Neden kapatıldığı; birkaç hafta sonra "bu niye kapalıydı" sorusunun cevabı.
  not_metni text,
  guncelleme timestamptz not null default now()
);

comment on table public.eposta_akislari is
  'E-posta bildirimlerinin açma/kapama anahtarı. Akışların kataloğu kodda (lib/eposta-akislari.ts).';

alter table public.eposta_akislari enable row level security;

drop policy if exists eposta_akislari_admin_all on public.eposta_akislari;
create policy eposta_akislari_admin_all on public.eposta_akislari
  for all using (is_admin()) with check (is_admin());

grant select, insert, update on public.eposta_akislari to authenticated;

/*
  Gönderim günlüğü.

  Başarısız gönderim de yazılıyor, hatta asıl işe yarayan o: "gitmedi"nin
  sebebi (adres yok, Resend hatası, akış kapalı) burada duruyor.

  alici tam olarak yazılıyor, maskelenmiyor: günlüğü yalnızca yönetici
  görüyor ve "hangi adrese gitti" sorusu bu kaydın var olma sebebi. Maskeli
  bir adres, yanlış adrese gitmiş bir maili bulmayı imkânsız kılardı.
*/
create table if not exists public.eposta_gunlugu (
  id uuid primary key default gen_random_uuid(),
  akis text not null,
  alici text,
  konu text,
  -- 'gonderildi' | 'basarisiz' | 'kapali' | 'yapilandirilmadi'
  durum text not null,
  sebep text,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.eposta_gunlugu is
  'Gönderilen ve gönderilemeyen bildirim e-postalarının kaydı. Yalnızca sunucu yazar, yalnızca yönetici okur.';

alter table public.eposta_gunlugu enable row level security;

/*
  Okuma yalnızca yöneticide — günlükte katılımcıların e-posta adresleri ve
  mail konuları var, kendi satırını görmesinin de bir faydası yok.

  YAZMA hiç kimseye açık değil: kayıtları sunucu servis anahtarıyla atıyor.
  Tarayıcıdan yazılabilen bir gönderim günlüğü, "gitti mi" sorusuna güvenilir
  cevap veremezdi.
*/
drop policy if exists eposta_gunlugu_admin_select on public.eposta_gunlugu;
create policy eposta_gunlugu_admin_select on public.eposta_gunlugu
  for select using (is_admin());

grant select on public.eposta_gunlugu to authenticated;

create index if not exists eposta_gunlugu_tarih_idx on public.eposta_gunlugu (created_at desc);
create index if not exists eposta_gunlugu_akis_idx on public.eposta_gunlugu (akis, created_at desc);
