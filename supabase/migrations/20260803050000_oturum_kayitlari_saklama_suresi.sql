-- Giriş kayıtlarının saklama süresi.
--
-- Panelde öğrenciye "Kayıtlar 90 gün saklanır, sonra silinir" yazıyordu ama
-- silen bir şey yoktu: ne tetikleyici, ne zamanlanmış görev. Yani hem tablo
-- sonsuza kadar büyüyecekti hem de verilen söz tutulmuyordu.
--
-- Her giriş bir satır; 300 kişi ayda birkaç kez girse yılda on binlerce satır
-- eder ve içinde IP, konum gibi kişisel veri var.

create or replace function public.eski_oturum_kayitlarini_sil()
returns void language sql security definer set search_path to 'public'
as $$
  delete from public.oturum_kayitlari where created_at < now() - interval '90 days';
$$;

comment on function public.eski_oturum_kayitlarini_sil is
  '90 günden eski giriş kayıtlarını siler. Günlük cron ile çalışır.';

-- SECURITY DEFINER fonksiyonlar PostgREST üzerinden /rest/v1/rpc/... olarak
-- dışarı açılıyor; bu haliyle giriş yapmış herhangi biri tüm kayıtları
-- silebilirdi. Yalnızca zamanlayıcı çağırmalı.
revoke all on function public.eski_oturum_kayitlarini_sil() from public, anon, authenticated;

-- Tetikleyici olarak çalışan fonksiyonun da dışarıdan çağrılabilir olmasının
-- gerekçesi yok.
revoke all on function public.profil_rol_koru() from public, anon, authenticated;

select cron.unschedule('oturum-kayit-temizligi')
where exists (select 1 from cron.job where jobname = 'oturum-kayit-temizligi');

-- 03:15 UTC — Türkiye'de 06:15, kimsenin panelde olmadığı bir saat.
select cron.schedule('oturum-kayit-temizligi', '15 3 * * *',
  $$ select public.eski_oturum_kayitlarini_sil(); $$);
