/*
  Güvenlik denetimi (Supabase advisors) sonrası sıkılaştırma.

  1) gorev_sagligi(): SECURITY DEFINER ve oturum açmış herkese açıktı; öğrenci
     de zamanlanmış görevlerin HTTP sağlığını okuyabiliyordu. Yetki geri
     alınmadı — tanılama ekranı fonksiyonu yöneticinin kendi oturumuyla
     çağırıyor, revoke o ekranı kırardı. Onun yerine fonksiyonun içinde
     is_admin() kontrolü var. Dönüş biçimi aynı.

  2) is_ilani_damga() ve is_ilani_suresi_doldu(): search_path sabit değildi
     (lint 0011). Gövdeler yalnızca now() ve satır alanlarını kullanıyor;
     davranış değişmiyor.

  BİLEREK DOKUNULMAYANLAR:
  - is_admin() / is_enrolled() anon'a açık: kurslar, bloglar, yorumlar ve
    yasal sayfaların herkese açık okuma politikaları bu fonksiyonları
    çağırıyor. anon'dan EXECUTE geri alınırsa ziyaretçi sitede hiçbir şey
    göremez. Oturumsuz çağrıda ikisi de false dönüyor; sızan bilgi yok.
  - banka_ayarlari / form_ayarlari / meta_pixel_ayari / olcumleme_ayarlari
    görünümleri (security definer view): settings tablosundan yalnızca zaten
    herkese açık alanları (IBAN, piksel kimliği, form bağlantısı) veriyorlar.
  - pg_net public şemada: eklenti şema taşımayı desteklemiyor, fonksiyonları
    zaten net şemasında.
*/

create or replace function public.gorev_sagligi()
returns table (toplam integer, basarili integer, basarisiz integer, son_durum integer, son_zaman timestamptz)
language plpgsql
security definer
set search_path = public, net
as $$
begin
  if not public.is_admin() then
    raise exception 'Bu bilgi için yönetici yetkisi gerekir';
  end if;

  return query
  select
    count(*)::int,
    count(*) filter (where r.status_code between 200 and 299)::int,
    count(*) filter (where r.status_code is null or r.status_code >= 400)::int,
    (select r2.status_code from net._http_response r2 order by r2.created desc limit 1),
    (select r2.created from net._http_response r2 order by r2.created desc limit 1)
  from net._http_response r
  where r.created > now() - interval '24 hours';
end;
$$;

revoke execute on function public.gorev_sagligi() from public, anon;

alter function public.is_ilani_damga() set search_path = public;
alter function public.is_ilani_suresi_doldu(public.is_ilanlari) set search_path = public;
