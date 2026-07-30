-- Faz 1: who owns which course, and how far they've watched.
--
-- Enrollment is assigned by an admin for now (sales happen off-site); the same
-- table is what an online checkout would write to later, so nothing here has to
-- change when payments land.

create type enrollment_durum as enum ('aktif', 'tamamlandi', 'iptal');

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  durum enrollment_durum not null default 'aktif',
  atanma_tarihi timestamptz not null default now(),
  admin_notu text,
  unique (user_id, course_id)
);

create table lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  tamamlandi boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index enrollments_user_id_idx on enrollments(user_id);
create index enrollments_course_id_idx on enrollments(course_id);
create index lesson_progress_user_id_idx on lesson_progress(user_id);

-- Admin student lists need an email to show; auth.users isn't readable under
-- RLS, so mirror it onto the profile at signup.
alter table profiles add column email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, ad, soyad, email)
  values (
    new.id,
    new.raw_user_meta_data->>'ad',
    new.raw_user_meta_data->>'soyad',
    new.email
  );
  return new;
end;
$$;

-- security definer for the same reason is_admin() is: policies on courses call
-- this, and it reads enrollments, which would otherwise recurse.
create or replace function public.is_enrolled(target_course_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where course_id = target_course_id
      and user_id = auth.uid()
      and durum <> 'iptal'
  );
$$;

alter table enrollments enable row level security;
alter table lesson_progress enable row level security;

create policy enrollments_select_own_or_admin on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());

create policy enrollments_admin_insert on public.enrollments
  for insert with check (public.is_admin());

create policy enrollments_admin_update on public.enrollments
  for update using (public.is_admin());

create policy enrollments_admin_delete on public.enrollments
  for delete using (public.is_admin());

create policy lesson_progress_select_own_or_admin on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_admin());

-- A student may only ever write progress rows for lessons in a course they
-- actually own, and only for themselves.
create policy lesson_progress_insert_own on public.lesson_progress
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from lessons l
      join modules m on m.id = l.module_id
      where l.id = lesson_progress.lesson_id
        and public.is_enrolled(m.course_id)
    )
  );

create policy lesson_progress_update_own on public.lesson_progress
  for update using (user_id = auth.uid());

-- Archiving a course must not revoke access for students who already own it
-- (the admin UI promises exactly this), so enrolled users bypass the
-- published/visible check on the course and its curriculum.
drop policy courses_public_read_published on public.courses;
create policy courses_public_read_published on public.courses
  for select using (
    (durum = 'yayinda' and sitede_gorunur = true)
    or public.is_admin()
    or public.is_enrolled(id)
  );

drop policy modules_public_read on public.modules;
create policy modules_public_read on public.modules
  for select using (
    exists (
      select 1 from courses c
      where c.id = modules.course_id
        and (
          (c.durum = 'yayinda' and c.sitede_gorunur = true)
          or public.is_admin()
          or public.is_enrolled(c.id)
        )
    )
  );

drop policy lessons_public_read on public.lessons;
create policy lessons_public_read on public.lessons
  for select using (
    exists (
      select 1 from modules m
      join courses c on c.id = m.course_id
      where m.id = lessons.module_id
        and (
          (c.durum = 'yayinda' and c.sitede_gorunur = true)
          or public.is_admin()
          or public.is_enrolled(c.id)
        )
    )
  );
