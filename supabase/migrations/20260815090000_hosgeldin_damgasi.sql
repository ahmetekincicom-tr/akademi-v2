-- Hoş geldin maili damgası.
--
-- Mail ilk GİRİŞTE gönderiliyor, kayıt anında değil: e-posta doğrulaması açıkken
-- kayıt olan kişi henüz hesabını kullanamıyor ve o anda "hoş geldin" demek
-- erken oluyor. İçe aktarılan öğrenciler de kayıt akışından geçmiyor; ilk giriş
-- ikisini birden yakalayan tek an.
alter table public.profiles
  add column if not exists hosgeldin_tarihi timestamptz;

comment on column public.profiles.hosgeldin_tarihi is
  'Hoş geldin e-postasının gönderildiği an. Boşsa henüz gönderilmedi.';

-- profiles'ta UPDATE yetkisi kolon kolon veriliyor. Yeni kolon listeye
-- eklenmezse damga sessizce yazılamaz — ve damga yazılamayınca mail HER
-- GİRİŞTE tekrar gider. RLS geçse bile yetki katmanı önde.
grant update (hosgeldin_tarihi) on public.profiles to authenticated;
