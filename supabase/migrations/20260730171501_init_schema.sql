-- Roles, courses, curriculum (modules/lessons), and profile auto-provisioning.

create type user_role as enum ('ogrenci', 'admin');
create type course_durum as enum ('taslak', 'yayinda', 'arsivlendi');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ad text,
  soyad text,
  telefon text,
  sirket text,
  role user_role not null default 'ogrenci',
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  baslik text not null,
  baslik_vurgu text not null,
  aciklama text,
  hero_aciklama text,
  sure text,
  format text,
  seviye text,
  durum course_durum not null default 'taslak',
  sitede_gorunur boolean not null default true,
  satisa_acik boolean not null default true,
  fiyat_gorunur boolean not null default false,
  -- Everything in the public course-detail template that doesn't need its own
  -- relational column (kazanımlar, uygun/uygunDeğil, format tablosu, yorumlar,
  -- sss, kutuSatır, online/yüzYüze, etiket, hızlı bilgiler...) lives here so the
  -- existing Course TS shape can be reconstructed losslessly.
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  sira int not null,
  baslik text not null,
  meta text
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  sira int not null,
  baslik text not null,
  sure text
);

create index modules_course_id_idx on modules(course_id);
create index lessons_module_id_idx on lessons(module_id);

-- security definer avoids RLS self-recursion when policies check role
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, ad, soyad)
  values (new.id, new.raw_user_meta_data->>'ad', new.raw_user_meta_data->>'soyad');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table profiles enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;

create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy courses_public_read_published on public.courses
  for select using ((durum = 'yayinda' and sitede_gorunur = true) or public.is_admin());

create policy courses_admin_write on public.courses
  for insert with check (public.is_admin());

create policy courses_admin_update on public.courses
  for update using (public.is_admin());

create policy courses_admin_delete on public.courses
  for delete using (public.is_admin());

create policy modules_public_read on public.modules
  for select using (
    exists (
      select 1 from courses c
      where c.id = modules.course_id
        and ((c.durum = 'yayinda' and c.sitede_gorunur = true) or public.is_admin())
    )
  );

create policy modules_admin_write on public.modules
  for insert with check (public.is_admin());

create policy modules_admin_update on public.modules
  for update using (public.is_admin());

create policy modules_admin_delete on public.modules
  for delete using (public.is_admin());

create policy lessons_public_read on public.lessons
  for select using (
    exists (
      select 1 from modules m
      join courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and ((c.durum = 'yayinda' and c.sitede_gorunur = true) or public.is_admin())
    )
  );

create policy lessons_admin_write on public.lessons
  for insert with check (public.is_admin());

create policy lessons_admin_update on public.lessons
  for update using (public.is_admin());

create policy lessons_admin_delete on public.lessons
  for delete using (public.is_admin());
