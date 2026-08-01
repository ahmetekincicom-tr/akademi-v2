-- Course-page content the admin edits without touching code: the enrolment
-- announcement in the hero, and the instructor block.
--
-- Not stored in `settings`, which only admins can read — these strings are
-- rendered on public pages, so a visitor's anonymous key has to see them.
-- Single row, same shape as `marka`.

create table site_icerik (
  id boolean primary key default true,
  constraint site_icerik_tek_satir check (id),

  -- Hero'daki dikkat çekici kayıt durumu şeridi
  kayit_duyurusu text,
  kayit_duyurusu_aktif boolean not null default false,

  egitmen_ad text,
  egitmen_unvan text,
  egitmen_biyografi text,

  updated_at timestamptz not null default now()
);

insert into site_icerik (id, egitmen_ad, egitmen_unvan, egitmen_biyografi)
values (
  true,
  'Ahmet Ekinci',
  'Dijital pazarlama eğitmeni · Ankara',
  '2021''den bu yana yalnızca birebir eğitim veriyor. Derslerde teori anlatmak yerine katılımcının kendi hesabı üzerinde çalışıyor; eğitim bittikten sonra da soru-cevap kanalından desteği sürdürüyor.'
)
on conflict (id) do nothing;

alter table site_icerik enable row level security;

-- Ziyaretçi de okur: eğitim detay sayfası bu satırı gösteriyor.
create policy site_icerik_herkes_okur on public.site_icerik
  for select to anon, authenticated using (true);

create policy site_icerik_admin_update on public.site_icerik
  for update using (public.is_admin());
