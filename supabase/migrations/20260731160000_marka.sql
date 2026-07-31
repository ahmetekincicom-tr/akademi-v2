-- Logo and favicon become admin-managed. They were baked into the Logo
-- component and the favicon.ico file, so changing them meant a deploy.
--
-- Deliberately not stored in `settings`: that table is admin-only readable, and
-- the logo has to be visible to every anonymous visitor.

create table marka (
  -- single-row table: the check keeps a second row from ever being inserted
  id boolean primary key default true,
  constraint marka_tek_satir check (id),
  -- light-coloured logo, shown on the dark header/footer
  logo_koyu_zemin text,
  -- dark-coloured logo, shown on white backgrounds
  logo_acik_zemin text,
  favicon text,
  updated_at timestamptz not null default now()
);

insert into marka (id) values (true) on conflict (id) do nothing;

alter table marka enable row level security;

create policy marka_public_read on public.marka
  for select to anon, authenticated using (true);
create policy marka_admin_update on public.marka
  for update using (public.is_admin());

-- Brand assets are public by definition; kept apart from the reference-logo
-- bucket so clearing one cannot touch the other.
insert into storage.buckets (id, name, public)
values ('marka', 'marka', true)
on conflict (id) do nothing;

create policy "marka admin yukleme" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'marka' and public.is_admin());

create policy "marka admin silme" on storage.objects
  for delete to authenticated
  using (bucket_id = 'marka' and public.is_admin());

create policy "marka herkese acik okuma" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'marka');
