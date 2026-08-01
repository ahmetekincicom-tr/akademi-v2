-- Security fixes found while auditing the live database.
--
-- 1) CRITICAL — privilege escalation through profiles.
--    The profiles UPDATE policy allowed a user to update their own row, and
--    `authenticated` held UPDATE on every column including `role`. Any signed-in
--    student could therefore promote themselves with a single API call:
--      PATCH /rest/v1/profiles?id=eq.<own id>   {"role":"admin"}
--    which would have handed them every student's data, payments and messages.
--    RLS restricts *rows*, not *columns*, so the fix is column-level grants.

revoke update on public.profiles from anon, authenticated;
grant update (ad, soyad, telefon, sirket) on public.profiles to authenticated;

-- Role changes stay possible, but only through a function that checks first.
create or replace function public.rol_ata(hedef_kullanici uuid, yeni_rol user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Bu işlem için yönetici yetkisi gerekir';
  end if;

  update public.profiles set role = yeni_rol where id = hedef_kullanici;
end;
$$;

revoke execute on function public.rol_ata(uuid, user_role) from public, anon;
grant execute on function public.rol_ata(uuid, user_role) to authenticated;

-- 2) The documents policy applied to the `public` role, and its `course_id is
--    null` branch is true for anonymous callers — so a signed-out visitor could
--    list every shared document's title and storage path. The files themselves
--    were safe (the storage policy is authenticated-only), but the listing was
--    not meant to be public.

drop policy documents_select_enrolled_or_admin on public.documents;
create policy documents_select_enrolled_or_admin on public.documents
  for select to authenticated
  using (public.is_admin() or course_id is null or public.is_enrolled(course_id));

-- 3) Public buckets serve their object URLs without consulting RLS, so these
--    broad SELECT policies added nothing except the ability to enumerate every
--    file in the bucket. Logos keep loading without them.

drop policy "logolar herkese acik okuma" on storage.objects;
drop policy "marka herkese acik okuma" on storage.objects;

-- 4) The contact form is deliberately open to anonymous submissions, so it
--    cannot be locked down without breaking it. Bound the damage instead: a
--    single request can no longer store megabytes of text.

alter table public.iletisim_mesajlari
  add constraint iletisim_ad_uzunluk check (char_length(ad) between 2 and 120),
  add constraint iletisim_email_uzunluk check (char_length(email) between 5 and 200),
  add constraint iletisim_mesaj_uzunluk check (char_length(mesaj) between 10 and 5000),
  add constraint iletisim_konu_uzunluk check (konu is null or char_length(konu) <= 200),
  add constraint iletisim_telefon_uzunluk check (telefon is null or char_length(telefon) <= 40),
  add constraint iletisim_sirket_uzunluk check (sirket is null or char_length(sirket) <= 160);
