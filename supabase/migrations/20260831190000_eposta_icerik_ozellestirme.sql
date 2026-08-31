-- E-posta metinlerinin panelden düzenlenebilmesi.
--
-- Metinler bugüne kadar yalnızca kodda duruyordu. Resend'de de yoklar ve
-- olamazlar: Resend yalnızca postacı — gövdeyi biz üretip hazır HTML olarak
-- veriyoruz, orada düzenlenecek bir şablon hiç oluşmuyor. Dolayısıyla bir
-- cümleyi değiştirmek için her seferinde kod değişikliği gerekiyordu.
--
-- Sütunlar akış tablosuna EKLENİYOR, ayrı bir tabloya değil: akış başına tek
-- satır zaten var ve "bu akış açık mı" ile "bu akış ne diyor" aynı şeyin iki
-- yüzü. İkinci bir tablo, aynı anahtarı iki yerde tutmak olurdu.
--
-- Hepsi NULL olabilir ve NULL "koddaki varsayılan" demek. Boş string DEĞİL:
-- boş bırakılmış bir başlık ile hiç dokunulmamış bir başlık farklı şeyler.
--
-- Satır listeleri (Tarih ve saat, Program, Süre…) bilerek dışarıda: onlar
-- metin değil veri ve panelden yazılabilir olsalardı gerçek kayıtla
-- tutmayan bir tablo üretmek mümkün olurdu.

alter table public.eposta_akislari
  add column if not exists konu text,
  add column if not exists ust_etiket text,
  add column if not exists baslik text,
  add column if not exists ozet text,
  add column if not exists eylem_etiketi text;

comment on column public.eposta_akislari.konu is
  'Mail konusu. NULL ise koddaki varsayılan kullanılıyor. {ad} gibi değişkenler destekleniyor.';
comment on column public.eposta_akislari.ozet is
  'Başlığın altındaki paragraf. NULL ise koddaki varsayılan.';
