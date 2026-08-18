-- Kayıt ekranında telefon ve sözleşme onayları.

alter table public.profiles
  add column if not exists sozlesme_onayi_tarihi timestamptz,
  add column if not exists ileti_izni boolean not null default false,
  add column if not exists ileti_izni_tarihi timestamptz;

comment on column public.profiles.sozlesme_onayi_tarihi is
  'Üyelik sözleşmesi ve aydınlatma metninin kabul edildiği an.';
comment on column public.profiles.ileti_izni is
  '6563 sayılı Kanun kapsamında ticari elektronik ileti izni. Kayıt sırasında ayrı ve işaretsiz sorulur.';
comment on column public.profiles.ileti_izni_tarihi is
  'İznin verildiği an. İYS kaydında ispat yükümlülüğü için tarih gerekiyor.';

-- Öğrenci kendi iletişim tercihini panelden değiştirebilmeli.
-- profiles'ta UPDATE yetkisi kolon kolon veriliyor; listeye eklenmezse
-- değişiklik sessizce reddedilir.
grant update (ileti_izni, ileti_izni_tarihi) on public.profiles to authenticated;

/*
  Kayıt formundaki alanlar profile buradan geçiyor.

  ONAY TARİHLERİ METADATA'DAN ALINMIYOR, now() ile damgalanıyor: raw_user_meta_data
  kayıt isteğiyle birlikte tarayıcıdan geliyor ve kullanıcı istediği tarihi
  yazabilir. Onayın ne zaman verildiği ispat gerektiren bir bilgi — sunucu saati
  dışında bir kaynağa güvenilemez.
*/
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ileti boolean := coalesce((new.raw_user_meta_data->>'ileti_izni')::boolean, false);
  v_sozlesme boolean := coalesce((new.raw_user_meta_data->>'sozlesme_onayi')::boolean, false);
begin
  -- email UNUTULMAMALI: auth.users RLS altında okunamıyor, admin listeleri ve
  -- öğrenciye giden bildirimlerin alıcısı bu aynadan geliyor. Bu satır bir kez
  -- düşürüldü ve o tarihten sonra açılan hesaplarda mail sessizce gitmedi
  -- (bkz. 20260818140000_profil_eposta_aynasini_onar.sql).
  insert into public.profiles (id, ad, soyad, email, telefon, sozlesme_onayi_tarihi, ileti_izni, ileti_izni_tarihi)
  values (
    new.id,
    new.raw_user_meta_data->>'ad',
    new.raw_user_meta_data->>'soyad',
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

-- Kayıt ekranında onaylanan sözleşme. Diğer yasal metinlerle aynı tabloda ve
-- aynı şekilde boş/yayınlanmamış başlıyor: boş bir sözleşmeye onay aldırmak,
-- hiç sözleşme olmamasından kötü.
insert into yasal_sayfalar (slug, baslik, ozet, sira, yayinda)
values (
  'uyelik-sozlesmesi',
  'Üyelik ve Kullanım Sözleşmesi',
  'Üye alanının kullanım koşulları, tarafların hak ve yükümlülükleri.',
  0,
  false
)
on conflict (slug) do nothing;
