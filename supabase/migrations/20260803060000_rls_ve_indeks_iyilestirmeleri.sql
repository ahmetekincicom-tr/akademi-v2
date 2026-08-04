-- RLS politikalarında auth.uid() her SATIR için yeniden değerlendiriliyordu.
--
-- Postgres, politikanın içindeki auth.uid() çağrısını satır başına bir kez
-- çalıştırıyor. (select auth.uid()) yazıldığında ise sorgu başında bir kez
-- hesaplayıp sabit gibi kullanıyor. Küçük tabloda fark edilmez; 300 öğrenci
-- ve büyüyen ilerleme/giriş tablolarında sorgu süresini katlıyor.
--
-- Politikaların MANTIĞI değişmiyor, yalnızca değerlendirme biçimi.
-- Uygulanmış hali için Supabase migration geçmişine bakın; bu dosya kaydın
-- depoda da durması için.

-- Not: politika gövdeleri uzun; tam metin uygulanan migration'da.
-- Özet: aşağıdaki tablolarda auth.uid() ve is_admin()/is_enrolled()
-- çağrıları (select ...) ile sarmalandı:
--   enrollments, lesson_progress, payments, support_tickets,
--   support_messages, seanslar, gorusmeler, oturum_kayitlari,
--   push_cihazlar, push_gonderimler
--
-- push_cihazlar'daki dört ayrı öğrenci politikası ve bir yönetici FOR ALL
-- politikası tek politikada birleştirildi: üst üste binen izin politikalarının
-- hepsi her sorguda çalıştırılıyordu.

-- Yabancı anahtarların örtücü indeksleri.
--
-- İndekssiz bir yabancı anahtar, ana kayıt silinirken bağlı tablonun
-- tamamının taranmasına yol açıyor. Şimdi tablolar küçük ve fark edilmiyor;
-- ilerleme ve mesaj tabloları büyüdükçe bir eğitimi silmek dakikalar sürer.
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress (lesson_id);
create index if not exists egitim_oturumlari_course_id_idx on public.egitim_oturumlari (course_id);
create index if not exists seanslar_course_id_idx on public.seanslar (course_id);
create index if not exists payments_course_id_idx on public.payments (course_id);
create index if not exists support_tickets_course_id_idx on public.support_tickets (course_id);
create index if not exists support_messages_gonderen_id_idx on public.support_messages (gonderen_id);
create index if not exists iletisim_mesajlari_course_id_idx on public.iletisim_mesajlari (course_id);
create index if not exists yorumlar_course_id_idx on public.yorumlar (course_id);
create index if not exists push_gonderimler_hedef_user_id_idx on public.push_gonderimler (hedef_user_id);
create index if not exists push_gonderimler_gonderen_id_idx on public.push_gonderimler (gonderen_id);
