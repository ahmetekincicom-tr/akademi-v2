-- Eğitim kayıtları, eğitim takviminden ayrılıyor.
--
-- Kayıt bağlantısı şimdiye kadar egitim_oturumlari.kayit_link'te, yani her
-- oturumun kendi satırında duruyordu. Uygulamada kayıtlar tek bir Drive
-- klasöründe toplanıyor ve o klasörün adresi her oturuma tek tek yapıştırmak
-- gerekiyordu: on ders yapılan bir katılımcı için aynı bağlantı on kere.
-- Klasöre yeni kayıt eklendiğinde de panelde görünecek bir şey değişmiyordu.
--
-- Arşiv artık kişinin kendisine bağlı. Bir satır bir klasör (ya da tek bir
-- video); çoğu katılımcıda bir tane olacak, programı ayrı yürüyenlerde
-- birden fazla olabilsin diye tablo, sütun değil.
--
-- egitim_oturumlari.kayit_link kaldırılmıyor: orada duran veri geçerli ve
-- "yalnızca şu dersin kaydı" demek isteyen durum hâlâ var. İkisi panelde
-- ayrı yerlerde gösteriliyor.

create table if not exists public.egitim_kayit_arsivi (
  id uuid primary key default gen_random_uuid(),
  -- FK profiles'a, auth.users'a değil: egitim_oturumlari ile aynı sebep,
  -- PostgREST gömmesi bu ilişki olmadan çalışmıyor.
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  baslik text,
  link text not null,
  aciklama text,
  sira integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.egitim_kayit_arsivi is
  'Katılımcıya paylaşılan ders kaydı klasörleri. Tek bir dersin kaydı için egitim_oturumlari.kayit_link.';
comment on column public.egitim_kayit_arsivi.link is
  'Drive klasörü ya da video adresi. Yalnızca satırın sahibi ve admin okuyabilir.';

alter table public.egitim_kayit_arsivi enable row level security;

-- egitim_oturumlari ile aynı erişim modeli: okuma sahibine ve admine,
-- yazma yalnızca admine. Katılımcı kendi arşivine satır ekleyemiyor.
drop policy if exists egitim_kayit_arsivi_select_own_or_admin on public.egitim_kayit_arsivi;
create policy egitim_kayit_arsivi_select_own_or_admin on public.egitim_kayit_arsivi
  for select using ((user_id = (select auth.uid())) or is_admin());

drop policy if exists egitim_kayit_arsivi_admin_insert on public.egitim_kayit_arsivi;
create policy egitim_kayit_arsivi_admin_insert on public.egitim_kayit_arsivi
  for insert with check (is_admin());

drop policy if exists egitim_kayit_arsivi_admin_update on public.egitim_kayit_arsivi;
create policy egitim_kayit_arsivi_admin_update on public.egitim_kayit_arsivi
  for update using (is_admin());

drop policy if exists egitim_kayit_arsivi_admin_delete on public.egitim_kayit_arsivi;
create policy egitim_kayit_arsivi_admin_delete on public.egitim_kayit_arsivi
  for delete using (is_admin());

grant select, insert, update, delete on public.egitim_kayit_arsivi to authenticated;

create index if not exists egitim_kayit_arsivi_user_idx
  on public.egitim_kayit_arsivi (user_id, sira, created_at);
