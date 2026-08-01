-- Post-training one-to-one consultations.
--
-- Distinct from `seanslar`, which covers the sessions that are part of an
-- active course. These are consultations a participant books after finishing:
-- a fixed number are free, the rest are paid.
--
-- Payment is bank transfer confirmed by an admin for now. The columns are
-- shaped so an online provider can be added later without a data migration:
-- odeme_yontemi records how it was paid and odeme_referansi holds either the
-- transfer note or the provider's transaction id.

create type gorusme_durum as enum ('talep', 'odeme_bekliyor', 'planlandi', 'tamamlandi', 'iptal');

create table gorusme_ayarlari (
  id boolean primary key default true,
  constraint gorusme_ayarlari_tek_satir check (id),
  ucretsiz_hak int not null default 3,
  ucret numeric(12, 2) not null default 0,
  sure_dk int not null default 45,
  odeme_aciklamasi text,
  aktif boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into gorusme_ayarlari (id) values (true) on conflict (id) do nothing;

create table gorusmeler (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  konu text not null,
  aciklama text,
  -- serbest metin: "hafta içi akşam 20:00 sonrası" gibi
  tercih_zaman text,
  -- talep anında sunucuda belirlenir, istemci belirleyemez
  ucretsiz boolean not null,
  ucret numeric(12, 2),
  odendi boolean not null default false,
  odeme_yontemi text,
  odeme_referansi text,
  odendi_at timestamptz,
  baslangic timestamptz,
  sure_dk int not null default 45,
  toplanti_link text,
  durum gorusme_durum not null default 'talep',
  admin_notu text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gorusmeler_user_id_idx on gorusmeler(user_id);
create index gorusmeler_durum_idx on gorusmeler(durum);

alter table gorusme_ayarlari enable row level security;
alter table gorusmeler enable row level security;

-- Students need the price and payment instructions to act on a due payment.
create policy gorusme_ayarlari_okuma on public.gorusme_ayarlari
  for select to authenticated using (true);
create policy gorusme_ayarlari_admin_update on public.gorusme_ayarlari
  for update using (public.is_admin());

create policy gorusmeler_select_own_or_admin on public.gorusmeler
  for select using (user_id = auth.uid() or public.is_admin());
create policy gorusmeler_admin_update on public.gorusmeler
  for update using (public.is_admin());
create policy gorusmeler_admin_delete on public.gorusmeler
  for delete using (public.is_admin());

-- Deliberately no INSERT policy for users. A direct insert would let a student
-- set ucretsiz = true as often as they liked and skip the fee entirely, so the
-- only way in is the function below, which decides both server-side.

create or replace function public.gorusme_talep_olustur(
  p_konu text,
  p_aciklama text default null,
  p_tercih_zaman text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ayar gorusme_ayarlari%rowtype;
  v_kullanilan int;
  v_ucretsiz boolean;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Oturum bulunamadı';
  end if;
  if coalesce(btrim(p_konu), '') = '' then
    raise exception 'Görüşme konusu zorunludur';
  end if;

  select * into v_ayar from gorusme_ayarlari where id;
  if not v_ayar.aktif then
    raise exception 'Görüşme talepleri şu anda kapalı';
  end if;

  -- Tek seferde tek bekleyen talep: sıraya girmiş kopyaları önler.
  if exists (
    select 1 from gorusmeler
    where user_id = v_user and durum in ('talep', 'odeme_bekliyor')
  ) then
    raise exception 'Zaten bekleyen bir görüşme talebin var';
  end if;

  -- İptal edilen görüşme hakkı yakmaz.
  select count(*) into v_kullanilan
  from gorusmeler
  where user_id = v_user and ucretsiz and durum <> 'iptal';

  v_ucretsiz := v_kullanilan < v_ayar.ucretsiz_hak;

  insert into gorusmeler (
    user_id, konu, aciklama, tercih_zaman, ucretsiz, ucret, sure_dk, durum
  )
  values (
    v_user,
    btrim(p_konu),
    nullif(btrim(coalesce(p_aciklama, '')), ''),
    nullif(btrim(coalesce(p_tercih_zaman, '')), ''),
    v_ucretsiz,
    case when v_ucretsiz then null else v_ayar.ucret end,
    v_ayar.sure_dk,
    case when v_ucretsiz then 'talep'::gorusme_durum else 'odeme_bekliyor'::gorusme_durum end
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- A student may withdraw a request that has not been scheduled yet. Anything
-- already planned goes through the admin, so nobody cancels on the morning of
-- a booked call without it being noticed.
create or replace function public.gorusme_iptal(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_sahip uuid;
  v_durum gorusme_durum;
begin
  if v_user is null then
    raise exception 'Oturum bulunamadı';
  end if;

  select user_id, durum into v_sahip, v_durum from gorusmeler where id = p_id;
  if v_sahip is null then
    raise exception 'Görüşme bulunamadı';
  end if;
  if v_sahip <> v_user and not public.is_admin() then
    raise exception 'Bu görüşmeyi iptal etme yetkin yok';
  end if;
  if v_durum not in ('talep', 'odeme_bekliyor') and not public.is_admin() then
    raise exception 'Planlanmış görüşmeyi iptal etmek için bize ulaş';
  end if;

  update gorusmeler
  set durum = 'iptal', updated_at = now()
  where id = p_id;
end;
$$;

revoke execute on function public.gorusme_talep_olustur(text, text, text) from public, anon;
grant execute on function public.gorusme_talep_olustur(text, text, text) to authenticated;

revoke execute on function public.gorusme_iptal(uuid) from public, anon;
grant execute on function public.gorusme_iptal(uuid) to authenticated;
