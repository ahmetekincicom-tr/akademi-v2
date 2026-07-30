-- Public form submissions: the contact form and the course quote request both
-- land here. Previously the contact form pretended to send and threw the
-- message away.

create type mesaj_turu as enum ('iletisim', 'teklif');

create table iletisim_mesajlari (
  id uuid primary key default gen_random_uuid(),
  tur mesaj_turu not null default 'iletisim',
  ad text not null,
  email text not null,
  telefon text,
  sirket text,
  konu text,
  mesaj text not null,
  -- set when the request came from a specific course page
  course_id uuid references courses(id) on delete set null,
  okundu boolean not null default false,
  created_at timestamptz not null default now()
);

create index iletisim_mesajlari_okundu_idx on iletisim_mesajlari(okundu);

alter table iletisim_mesajlari enable row level security;

-- Anyone may submit the form, including signed-out visitors; nobody but an
-- admin may read what was submitted.
create policy iletisim_herkes_gonderebilir on public.iletisim_mesajlari
  for insert to anon, authenticated
  with check (true);

create policy iletisim_admin_okur on public.iletisim_mesajlari
  for select using (public.is_admin());

create policy iletisim_admin_gunceller on public.iletisim_mesajlari
  for update using (public.is_admin());

create policy iletisim_admin_siler on public.iletisim_mesajlari
  for delete using (public.is_admin());
