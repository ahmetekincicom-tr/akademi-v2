-- Testimonials and client logos become admin-managed content. Both were
-- hardcoded arrays in the page files, so changing them meant a code deploy.
--
-- Note: "references" is a reserved word in Postgres, hence "referanslar".

create table yorumlar (
  id uuid primary key default gen_random_uuid(),
  metin text not null,
  isim text not null,
  rol text,
  -- optional: pin a testimonial to one course's detail page
  course_id uuid references courses(id) on delete set null,
  sira int not null default 0,
  yayinda boolean not null default true,
  created_at timestamptz not null default now()
);

create table referanslar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  sektor text,
  -- path inside the public "logolar" bucket; null renders the name as text
  logo_yolu text,
  site_url text,
  sira int not null default 0,
  yayinda boolean not null default true,
  created_at timestamptz not null default now()
);

create index yorumlar_sira_idx on yorumlar(sira, created_at);
create index referanslar_sira_idx on referanslar(sira, created_at);

alter table yorumlar enable row level security;
alter table referanslar enable row level security;

-- Published rows are public marketing content; everything else is admin-only.
create policy yorumlar_public_read on public.yorumlar
  for select using (yayinda = true or public.is_admin());
create policy yorumlar_admin_insert on public.yorumlar
  for insert with check (public.is_admin());
create policy yorumlar_admin_update on public.yorumlar
  for update using (public.is_admin());
create policy yorumlar_admin_delete on public.yorumlar
  for delete using (public.is_admin());

create policy referanslar_public_read on public.referanslar
  for select using (yayinda = true or public.is_admin());
create policy referanslar_admin_insert on public.referanslar
  for insert with check (public.is_admin());
create policy referanslar_admin_update on public.referanslar
  for update using (public.is_admin());
create policy referanslar_admin_delete on public.referanslar
  for delete using (public.is_admin());

-- Logos are shown to anonymous visitors, so this bucket is public: no signed
-- URLs, just a stable CDN path.
insert into storage.buckets (id, name, public)
values ('logolar', 'logolar', true)
on conflict (id) do nothing;

create policy "logolar admin yukleme" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logolar' and public.is_admin());

create policy "logolar admin silme" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logolar' and public.is_admin());

create policy "logolar herkese acik okuma" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'logolar');

-- Seed the testimonials that were previously baked into the course content
-- JSON, so the site does not go blank the moment this ships.
insert into yorumlar (metin, isim, rol, sira)
select
  y->>'metin',
  y->>'isim',
  y->>'rol',
  row_number() over ()
from courses c, jsonb_array_elements(c.content->'yorumlar') y
where jsonb_typeof(c.content->'yorumlar') = 'array';
