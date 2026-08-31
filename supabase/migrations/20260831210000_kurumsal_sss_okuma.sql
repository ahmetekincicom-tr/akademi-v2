-- Kurumsal sayfasının SSS içeriği ve onu okuyan kural.
--
-- İçerik settings tablosunda 'kurumsal' anahtarında duruyor: tek satırlık bir
-- metin için ayrı tablo, ayrı RLS ve ayrı migration demek olurdu.
--
-- SORUN: settings'in SELECT kuralı yalnızca yöneticiye açık. Kurumsal sayfası
-- ise anonim anahtarla okunuyor (ziyaretçiye ve yöneticiye aynı içeriği
-- göstermesi gerekiyor). Kural eklenmeden panelden yazılan SSS siteye HİÇ
-- yansımaz ve bu sessizce olur: sorgu hata değil sıfır satır döner, sayfa da
-- koddaki varsayılana düşüp doğru görünmeye devam ederdi.
--
-- Kural TEK ANAHTARLA sınırlı. settings içinde iyzico ve Meta ayarları da var;
-- tabloyu tümüyle açmak, bir içerik alanı uğruna sırları herkese okutmak
-- olurdu.

create policy settings_kurumsal_herkese_acik on public.settings
  for select
  to anon, authenticated
  using (anahtar = 'kurumsal');
