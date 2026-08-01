-- Kayıt duyurusunun görünümü admin panelinden seçilir: beyaz gövdeli "acik"
-- ya da siyah gövdeli "koyu". Kolon ayrı bir dosyada, çünkü site_icerik
-- migration'ı daha önce çalıştırılmış olabilir.

alter table site_icerik
  add column if not exists duyuru_stili text not null default 'acik';

alter table site_icerik
  drop constraint if exists site_icerik_duyuru_stili_gecerli;

alter table site_icerik
  add constraint site_icerik_duyuru_stili_gecerli
  check (duyuru_stili in ('acik', 'koyu'));
