-- Blog Faz 2: kategoriler + etiketler.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  ad text not null,
  sira int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Kategoriler gizli değil: herkes okur, yalnızca admin yazar.
create policy categories_public_read on public.categories for select using (true);
create policy categories_admin_insert on public.categories for insert with check (is_admin());
create policy categories_admin_update on public.categories for update using (is_admin());
create policy categories_admin_delete on public.categories for delete using (is_admin());

-- Yazıya kategori (tekil) ve etiketler (çoklu, serbest).
alter table public.posts
  add column if not exists kategori_id uuid references public.categories(id) on delete set null,
  add column if not exists etiketler text[] not null default '{}';

create index if not exists posts_kategori_idx on public.posts (kategori_id);
