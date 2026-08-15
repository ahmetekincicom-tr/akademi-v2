-- Anonim anahtarın (NEXT_PUBLIC_SUPABASE_ANON_KEY) görebildiği alanı daraltma.
--
-- O anahtar tanım gereği herkeste: tarayıcı paketinin içinde duruyor ve
-- durması gerekiyor. Dolayısıyla "anon'a açık" demek "internete açık" demek.
-- Aşağıdaki iki şey gereksiz yere oradaydı.

-- 1) Havale bilgileri.
--
-- IBAN sır değil; ödemeyi yapacak kişi zaten görecek. Ama herkesin toplu
-- olarak çekebileceği bir yerde durması ayrı bir şey: sahte bir "ödeme
-- sayfası" kuran biri için gerçek unvan ve IBAN hazır malzeme oluyor.
-- Bilgiye ihtiyaç duyan tek yer panelin ödeme ekranı ve orada oturum var.
revoke select on public.banka_ayarlari from anon;

-- 2) Ders videolarının kimliği.
--
-- lessons satırları herkese açık: müfredat (ders adları ve süreleri) eğitim
-- sayfasında zaten gösteriliyor. video_url ise gösterilmiyor — Bunny video
-- kimliği orada duruyor ve anonim bir istek
--
--   GET /rest/v1/lessons?select=video_url
--
-- ile bütün ders videolarının kimliğini toplayabiliyordu. Kimliğin tek başına
-- yeterli olup olmadığı Bunny tarafındaki "Token Authentication" ayarına
-- bakıyor; buna güvenmek yerine kimliği hiç vermemek doğrusu.
--
-- Kayıtlı öğrenci ve yönetici (authenticated) etkilenmiyor: onların sorgusu
-- oturumlu istemciden gidiyor ve RLS zaten kaydı olmayanı eliyor.
revoke select (video_url, aciklama) on public.lessons from anon;

-- İletişim formu boğması, aynı e-postadan son 10 dakikadaki kayıtları
-- sayıyor (src/app/mesaj-actions.ts). Sayım her mesajda çalıştığı için
-- indekssiz kalırsa tablo büyüdükçe form yavaşlar.
create index if not exists iletisim_mesajlari_email_tarih_idx
  on public.iletisim_mesajlari (email, created_at desc);
