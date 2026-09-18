-- posts.icerik_guncelleme — içeriğin GERÇEKTEN güncellendiği an.
--
-- Neden updated_at yetmiyor: updated_at her kayıt işleminde (migration, cache
-- temizleme, deploy sonrası dokunuş, şema değişikliği, tasarım kaynaklı toplu
-- güncelleme) ileri gidiyor ve bu teknik izi dateModified olarak göstermek
-- yanlış sinyal verir — Google'a ve okuyucuya "içerik değişti" der, oysa
-- değişmedi.
--
-- Bu alan YALNIZCA içerik gerçekten güncellendiğinde (yazar editörde
-- işaretleyince) doluyor. Blog UI ve BlogPosting/Article schema dateModified'ı
-- buradan alıyor; teknik updated_at ayrı kalıyor.
--
-- Geriye dönük doldurma YOK: null = "yayından beri içerik güncellenmedi".
-- Taşınan yazılarda bu doğru davranış — sahte bir güncelleme tarihi
-- üretmiyoruz; dateModified yayın tarihine düşüyor ve "Güncellendi" çıkmıyor.

alter table public.posts add column if not exists icerik_guncelleme timestamptz;

comment on column public.posts.icerik_guncelleme is
  'İçeriğin gerçekten güncellendiği an (yazar editörde işaretler). Teknik updated_at''ten ayrı; migration/deploy/cache bunu değiştirmez. dateModified ve blog UI bu alanı kullanır.';
