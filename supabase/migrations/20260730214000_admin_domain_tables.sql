-- Faz 2: the tables behind every remaining mock admin screen.
--
-- Payments are recorded by hand because sales happen off-site (havale, invoice,
-- one-to-one calls); the shape still fits an online checkout writing rows later.

create type payment_durum as enum ('odendi', 'bekliyor', 'iade');
create type ticket_durum as enum ('acik', 'yanitlandi', 'kapandi');
create type seans_durum as enum ('planlandi', 'tamamlandi', 'iptal');

-- These reference profiles rather than auth.users so PostgREST can resolve the
-- relationship and embed the student's name in a single query. profiles.id is
-- itself a FK to auth.users, so the delete cascade still reaches all the way.
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  tutar numeric(12, 2) not null,
  yontem text,
  durum payment_durum not null default 'odendi',
  odeme_tarihi timestamptz not null default now(),
  fatura_no text,
  admin_notu text,
  created_at timestamptz not null default now()
);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  baslik text not null,
  durum ticket_durum not null default 'acik',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  gonderen_id uuid not null references profiles(id) on delete cascade,
  metin text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  -- null course_id means the file is shared with every student
  course_id uuid references courses(id) on delete cascade,
  baslik text not null,
  dosya_yolu text not null unique,
  dosya_tipi text,
  boyut bigint,
  created_at timestamptz not null default now()
);

create table seanslar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  baslangic timestamptz not null,
  sure_dk int not null default 60,
  konu text,
  toplanti_link text,
  durum seans_durum not null default 'planlandi',
  notlar text,
  created_at timestamptz not null default now()
);

create table settings (
  anahtar text primary key,
  deger jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table lessons add column video_url text;
alter table lessons add column aciklama text;

create index payments_user_id_idx on payments(user_id);
create index support_tickets_user_id_idx on support_tickets(user_id);
create index support_messages_ticket_id_idx on support_messages(ticket_id);
create index documents_course_id_idx on documents(course_id);
create index seanslar_user_id_idx on seanslar(user_id);

alter table payments enable row level security;
alter table support_tickets enable row level security;
alter table support_messages enable row level security;
alter table documents enable row level security;
alter table seanslar enable row level security;
alter table settings enable row level security;

-- Payments are read-only for the student they belong to; only admins write.
create policy payments_select_own_or_admin on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy payments_admin_insert on public.payments
  for insert with check (public.is_admin());
create policy payments_admin_update on public.payments
  for update using (public.is_admin());
create policy payments_admin_delete on public.payments
  for delete using (public.is_admin());

-- Students open and read their own tickets; admins see all of them.
create policy tickets_select_own_or_admin on public.support_tickets
  for select using (user_id = auth.uid() or public.is_admin());
create policy tickets_insert_own on public.support_tickets
  for insert with check (user_id = auth.uid());
create policy tickets_update_own_or_admin on public.support_tickets
  for update using (user_id = auth.uid() or public.is_admin());
create policy tickets_admin_delete on public.support_tickets
  for delete using (public.is_admin());

create policy messages_select_own_or_admin on public.support_messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from support_tickets t
      where t.id = support_messages.ticket_id and t.user_id = auth.uid()
    )
  );
create policy messages_insert_participant on public.support_messages
  for insert with check (
    gonderen_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from support_tickets t
        where t.id = support_messages.ticket_id and t.user_id = auth.uid()
      )
    )
  );

-- A document is visible if it's global or attached to a course the user owns.
create policy documents_select_enrolled_or_admin on public.documents
  for select using (
    public.is_admin()
    or course_id is null
    or public.is_enrolled(course_id)
  );
create policy documents_admin_insert on public.documents
  for insert with check (public.is_admin());
create policy documents_admin_update on public.documents
  for update using (public.is_admin());
create policy documents_admin_delete on public.documents
  for delete using (public.is_admin());

create policy seanslar_select_own_or_admin on public.seanslar
  for select using (user_id = auth.uid() or public.is_admin());
create policy seanslar_admin_insert on public.seanslar
  for insert with check (public.is_admin());
create policy seanslar_admin_update on public.seanslar
  for update using (public.is_admin());
create policy seanslar_admin_delete on public.seanslar
  for delete using (public.is_admin());

-- Settings hold contact details and integration values: admin-only, both ways.
create policy settings_admin_select on public.settings
  for select using (public.is_admin());
create policy settings_admin_insert on public.settings
  for insert with check (public.is_admin());
create policy settings_admin_update on public.settings
  for update using (public.is_admin());

-- Private bucket; files are served through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('dokumanlar', 'dokumanlar', false)
on conflict (id) do nothing;

create policy "dokumanlar admin yukleme" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dokumanlar' and public.is_admin());

create policy "dokumanlar admin silme" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dokumanlar' and public.is_admin());

-- Mirrors the documents policy so knowing a path isn't enough to download it.
create policy "dokumanlar okuma" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'dokumanlar'
    and (
      public.is_admin()
      or exists (
        select 1 from public.documents d
        where d.dosya_yolu = storage.objects.name
          and (d.course_id is null or public.is_enrolled(d.course_id))
      )
    )
  );
