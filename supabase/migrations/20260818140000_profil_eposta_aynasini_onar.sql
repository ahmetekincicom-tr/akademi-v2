-- profiles.email aynası onarılıyor.
--
-- Regresyon: 20260815120000 (kayıt telefon ve onaylar) handle_new_user()'ı
-- yeniden yazarken insert kolon listesinden email'i düşürdü. O tarihten sonra
-- açılan her hesapta profiles.email boş kaldı.
--
-- Etkisi yalnızca kozmetik değil: öğrenciye giden bütün e-postalar (ödeme
-- bildirimi, hoş geldin) alıcıyı bu sütundan okuyor ve boşsa sessizce
-- gönderilmiyordu. auth.users RLS altında okunamadığı için bu ayna zorunlu.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_ileti boolean := coalesce((new.raw_user_meta_data->>'ileti_izni')::boolean, false);
  v_sozlesme boolean := coalesce((new.raw_user_meta_data->>'sozlesme_onayi')::boolean, false);
begin
  insert into public.profiles (
    id, ad, soyad, email, telefon, sozlesme_onayi_tarihi, ileti_izni, ileti_izni_tarihi
  )
  values (
    new.id,
    new.raw_user_meta_data->>'ad',
    new.raw_user_meta_data->>'soyad',
    -- Ayna: admin listeleri ve bildirim alıcıları buradan okuyor.
    new.email,
    nullif(new.raw_user_meta_data->>'telefon', ''),
    case when v_sozlesme then now() end,
    v_ileti,
    case when v_ileti then now() end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Kullanıcı adresini değiştirdiğinde ayna bayatlamasın. Eksik olan ikinci
-- parça buydu: ilk kurulumda yalnızca insert tarafı düşünülmüştü, dolayısıyla
-- e-posta değişikliği profiles'a hiç yansımıyordu.
create or replace function public.handle_user_email_degisti()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_degisti on auth.users;
create trigger on_auth_user_email_degisti
  after update of email on auth.users
  for each row execute function public.handle_user_email_degisti();

-- Boşta kalan kayıtları doldur.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null and u.email is not null;
