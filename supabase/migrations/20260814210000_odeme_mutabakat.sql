-- Ödeme mutabakatı: takılan denemeleri çözebilmek için iki eksik parça.
--
-- 1) callback_at — iyzico'nun dönüş isteği bize ULAŞTI mı?
--
-- Bu damga olmadan "baslatildi" durumu iki ayrı şeyi birden anlatıyor:
-- öğrenci ödemeden vazgeçti mi, yoksa ödedi de dönüş isteği mi bize
-- ulaşmadı? İlki normal, ikincisi para çekilmiş ama kaydı olmayan bir durum.
-- Damga token elimize geçer geçmez, hiçbir doğrulama yapılmadan atılıyor.
alter table public.odeme_denemeleri
  add column if not exists callback_at timestamptz;

comment on column public.odeme_denemeleri.callback_at is
  'iyzico dönüş isteğinin ulaştığı an. Boşsa dönüş hiç gelmemiş demektir.';

-- 2) Token üzerinden arama.
--
-- Dönüşü conversationId ile eşliyoruz ama iyzico sorgu cevabında bu alanı her
-- durumda döndürmüyor. Token de bizde kayıtlı; ikinci bir yol olarak
-- kullanılıyor ve indekssiz kalması tam tarama demek olurdu.
create index if not exists odeme_denemeleri_token_idx
  on public.odeme_denemeleri (token)
  where token is not null;

-- Mutabakat görevinin taradığı küme: sonucu belli olmamış denemeler.
create index if not exists odeme_denemeleri_askida_idx
  on public.odeme_denemeleri (created_at)
  where durum = 'baslatildi';
