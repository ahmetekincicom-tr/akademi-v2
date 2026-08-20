-- egitime_katildi_mi başkasının kaydını sorgulayamasın.
--
-- Fonksiyon SECURITY DEFINER ve authenticated rolüne açık; p_user parametresi
-- varsayılan olarak auth.uid() alıyor ama ELLE BAŞKA BİR UUID VERİLEBİLİYORDU.
-- Yani herhangi bir katılımcı, elindeki bir kullanıcı id'siyle "bu kişi
-- eğitime kayıtlı mı" sorusunu sorabiliyordu.
--
-- Tek başına büyük bir bilgi değil ve id'yi bilmek gerekiyor; ama kimsenin
-- ihtiyacı olmayan bir yetenek ve bu tür sorgular birleşince profil çıkarmaya
-- yarıyor. Parametre kalıyor (yönetim tarafı kişi bazında soruyor), erişim
-- daraltılıyor: kendin ya da yöneticiysen.

create or replace function public.egitime_katildi_mi(p_user uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user is null then
    return false;
  end if;

  -- Kendi kaydı değilse ve yönetici değilse cevap yok. Hata yerine false
  -- dönmek, "bu kişi kayıtlı değil" gibi okunur ve yine bilgi verirdi.
  if p_user <> auth.uid() and not public.is_admin() then
    raise exception 'Bu bilgiyi sorgulama yetkin yok';
  end if;

  return exists (
    select 1 from public.enrollments
    where user_id = p_user and durum <> 'iptal'
  );
end;
$$;
