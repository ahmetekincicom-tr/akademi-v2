-- Birebir EĞİTİM oturumları, birebir SEANSLARDAN ayrı bir şey:
--
--   egitim_oturumlari : eğitimin kendi takvimi. Katılımcıyla planlanan ders
--                       buluşmaları ve bunların Drive'daki kayıtları.
--   seanslar          : eğitim bittikten sonra kullanılan görüşme hakları.
--
-- Önceki sürümde ikisi seanslar tablosunda karışıyordu; kayıt bağlantısı da
-- oraya eklenmişti. Kayıt artık buraya ait.

create table if not exists public.egitim_oturumlari (
  id uuid primary key default gen_random_uuid(),
  -- FK profiles'a veriliyor, auth.users'a değil: seanslar da böyle ve
  -- PostgREST'in profiles(...) gömmesi bu ilişki olmadan çalışmıyor.
  -- profiles.id zaten auth.users.id'yi işaret ediyor, silme yine zincirleniyor.
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  baslangic timestamptz not null,
  sure_dk integer not null default 60,
  konu text,
  toplanti_link text,
  kayit_link text,
  durum seans_durum not null default 'planlandi',
  notlar text,
  created_at timestamptz not null default now()
);

comment on table public.egitim_oturumlari is
  'Birebir eğitimin takvimi ve kayıtları. Eğitim sonrası görüşme hakları için seanslar tablosuna bak.';
comment on column public.egitim_oturumlari.kayit_link is
  'Oturumun Drive kaydı. Yalnızca oturumun sahibi ve admin okuyabilir.';

alter table public.egitim_oturumlari enable row level security;

-- seanslar ile aynı erişim modeli: satır sahibine ve admine açık, yazma admine.
drop policy if exists egitim_oturumlari_select_own_or_admin on public.egitim_oturumlari;
create policy egitim_oturumlari_select_own_or_admin on public.egitim_oturumlari
  for select using ((user_id = (select auth.uid())) or is_admin());

drop policy if exists egitim_oturumlari_admin_insert on public.egitim_oturumlari;
create policy egitim_oturumlari_admin_insert on public.egitim_oturumlari
  for insert with check (is_admin());

drop policy if exists egitim_oturumlari_admin_update on public.egitim_oturumlari;
create policy egitim_oturumlari_admin_update on public.egitim_oturumlari
  for update using (is_admin());

drop policy if exists egitim_oturumlari_admin_delete on public.egitim_oturumlari;
create policy egitim_oturumlari_admin_delete on public.egitim_oturumlari
  for delete using (is_admin());

grant select on public.egitim_oturumlari to authenticated;
grant insert, update, delete on public.egitim_oturumlari to authenticated;

create index if not exists egitim_oturumlari_user_idx on public.egitim_oturumlari (user_id, baslangic desc);
