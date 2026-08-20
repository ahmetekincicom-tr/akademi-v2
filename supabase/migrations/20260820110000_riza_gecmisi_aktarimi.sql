-- Mevcut onay damgalarını riza_kayitlari'na taşı.
--
-- profiles.sozlesme_onayi_tarihi ve ileti_izni_tarihi gerçek, sunucu saatiyle
-- atılmış damgalar; yeni tabloya taşınmazsa bu hesaplar panelde "onay kaydı
-- yok" görünür ve elimizdeki kanıt görünmez kalır.
--
-- SADECE DAMGASI OLANLAR taşınıyor. Kayıtların büyük çoğunluğu Excel'den içe
-- aktarılmış hesaplar: onlar kayıt formundan geçmedi, bir sözleşme görmedi ve
-- bir şey onaylamadı. Onlar için satır üretmek, olmayan bir onayı varmış gibi
-- kaydetmek olurdu — bu tablonun tek işi doğru olmak.
--
-- belge_ozeti boş bırakılıyor: o gün hangi metnin gösterildiğini bilmiyoruz.
-- Bugünkü metnin özetini yazmak, kişinin görmediği bir metni onaylamış gibi
-- göstermek olurdu. Boş özet "sürümü bilinmiyor" demek; yanlış özet ise
-- yanlış bilgi.

insert into public.riza_kayitlari (user_id, belge, baglam, belge_basligi, created_at)
select
  p.id,
  'uyelik-sozlesmesi',
  'kayit',
  'Üyelik ve Kullanım Sözleşmesi',
  p.sozlesme_onayi_tarihi
from public.profiles p
where p.sozlesme_onayi_tarihi is not null
  and not exists (
    select 1 from public.riza_kayitlari r
    where r.user_id = p.id and r.belge = 'uyelik-sozlesmesi'
  );

insert into public.riza_kayitlari (user_id, belge, baglam, belge_basligi, created_at)
select
  p.id,
  'ticari-ileti-izni',
  'kayit',
  'Ticari elektronik ileti izni',
  p.ileti_izni_tarihi
from public.profiles p
where p.ileti_izni
  and p.ileti_izni_tarihi is not null
  and not exists (
    select 1 from public.riza_kayitlari r
    where r.user_id = p.id and r.belge = 'ticari-ileti-izni'
  );
