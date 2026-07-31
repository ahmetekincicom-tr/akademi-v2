-- Legal documents live in the database rather than in page files: their text is
-- lawyer-approved and changes on its own schedule (address changes, KVKK
-- updates), and editing it should never require a deploy.
--
-- Slugs deliberately match the existing ahmetekinciakademi.com URLs so links
-- and search results keep working if the domain moves to this site.

create table yasal_sayfalar (
  slug text primary key,
  baslik text not null,
  ozet text,
  icerik text not null default '',
  guncelleme date,
  sira int not null default 0,
  yayinda boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table yasal_sayfalar enable row level security;

create policy yasal_public_read on public.yasal_sayfalar
  for select using (yayinda = true or public.is_admin());
create policy yasal_admin_insert on public.yasal_sayfalar
  for insert with check (public.is_admin());
create policy yasal_admin_update on public.yasal_sayfalar
  for update using (public.is_admin());
create policy yasal_admin_delete on public.yasal_sayfalar
  for delete using (public.is_admin());

-- Seeded empty and unpublished: an empty legal page is worse than no link, so
-- each one stays hidden until its real text is pasted in from the admin panel.
insert into yasal_sayfalar (slug, baslik, ozet, sira, yayinda) values
  (
    'satis-sozlesmesi',
    'Mesafeli Satış Sözleşmesi',
    'Eğitim hizmetlerinin satışına ilişkin taraflar, konu, ödeme ve teslim koşulları.',
    1,
    false
  ),
  (
    'iptal-iade-politikasi',
    'İptal ve İade Politikası',
    'Cayma hakkı, iptal koşulları ve iade süreçleri.',
    2,
    false
  ),
  (
    'gizlilik-politikasi',
    'Gizlilik ve Güvenlik Politikası',
    'Toplanan verilerin nasıl saklandığı, korunduğu ve çerez kullanımı.',
    3,
    false
  ),
  (
    'kisisel-verilerin-islenmesi',
    'Kişisel Verilerin İşlenmesi (KVKK)',
    'KVKK kapsamında veri sorumlusu, işleme amaçları ve ilgili kişi hakları.',
    4,
    false
  )
on conflict (slug) do nothing;

grant execute on function public.is_admin() to anon, authenticated;
