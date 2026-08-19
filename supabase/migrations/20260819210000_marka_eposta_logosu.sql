-- E-posta şablonu için ayrı bir logo alanı.
--
-- Şablon şimdiye kadar yerleşik "AE" işaretini basıyordu; panelden yüklenen
-- logo hiç kullanılmıyordu. Doğrudan mevcut logoyu bağlamak çözüm değil:
-- ikisi de SVG ve SVG e-postada çalışmıyor. Gmail, Outlook ve Yahoo SVG'yi
-- hiç çizmiyor — mailin en üstünde kırık bir görsel çıkardı, hiç logo
-- olmamasından kötü.
--
-- Bu yüzden ayrı bir alan: yalnızca PNG/JPG kabul eden, koyu şerit üzerinde
-- okunacak (açık renkli) bir sürüm. Boş bırakılırsa şablon yine yazı
-- işaretine düşüyor, yani mail hiçbir zaman logosuz görünmüyor.

alter table public.marka
  add column if not exists eposta_logo text;

comment on column public.marka.eposta_logo is
  'E-posta başlığındaki logo. Yalnızca PNG/JPG: e-posta istemcileri SVG çizmiyor.';
