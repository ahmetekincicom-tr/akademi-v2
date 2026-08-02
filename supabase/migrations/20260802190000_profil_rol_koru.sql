-- profiles.role için ikinci savunma katmanı.
--
-- ÖNEMLİ — bu bir açığı kapatmıyor. Rol yükseltme zaten engelli: authenticated
-- rolüne profiles üzerinde yalnızca dört kolonda UPDATE yetkisi verilmiş
-- (ad, soyad, telefon, sirket). role bu listede olmadığı için öğrencinin
--
--   PATCH /rest/v1/profiles?id=eq.<kendi-id>  {"role":"admin"}
--
-- denemesi RLS'e ulaşmadan PostgreSQL yetki katmanında 42501 ile reddediliyor.
--
-- Tetikleyici o korumayı yedekliyor. Değeri şurada: profiles'a ileride geniş
-- bir GRANT UPDATE verilirse (Supabase'de yeni tablolarda varsayılan davranış
-- budur) kolon yetkisi devre dışı kalır ve role savunmasız kalırdı; bu
-- tetikleyici o durumda da devrede olur.
--
-- Politikanın kendisi de gevşek: profiles_update_own_or_admin'de WITH CHECK
-- yok, dolayısıyla USING ifadesi yeni satır için de kullanılıyor ve hangi
-- kolonun değiştiğine bakmıyor. Bugün zararsız, çünkü kolon yetkisi önde
-- duruyor.
--
-- Adminin rol ataması bundan etkilenmiyor: uygulamada rol değiştiren kod yok,
-- roller Supabase panelinden atanıyor ve service_role hem kolon yetkisini hem
-- bu tetikleyiciyi aşar.

create or replace function public.profil_rol_koru()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- is_admin() eski satır durumunu okur, dolayısıyla admin rol atamaya devam
  -- edebilir; kendi rolünü yükseltmeye çalışan öğrenci durur.
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Rol değiştirme yetkin yok.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_rol_koru on public.profiles;

create trigger profiles_rol_koru
  before update on public.profiles
  for each row execute function public.profil_rol_koru();
