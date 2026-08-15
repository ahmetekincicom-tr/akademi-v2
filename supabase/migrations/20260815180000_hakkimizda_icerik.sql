-- Hakkımızda sayfasının düzenlenebilir alanları.
--
-- site_icerik'e eklenmedi: oradaki egitmen_biyografi eğitim detay
-- sayfasındaki kısa eğitmen kutusunu besliyor. Hakkımızda sayfasındaki
-- "kimdir" bölümü çok daha uzun ve ayrı bir metin; ikisi tek sütunu
-- paylaşırsa biri diğerini bozmadan düzenlenemez.
--
-- Tek satır, site_icerik ve marka ile aynı biçim.

create table if not exists public.hakkimizda_icerik (
  id boolean primary key default true,
  constraint hakkimizda_icerik_tek_satir check (id),

  -- Hero
  hero_etiket text,
  hero_baslik text,
  hero_vurgu text,
  hero_metin text,

  -- "Ahmet Ekinci kimdir?" — biyografiden bağımsız, uzun metin
  kisi_etiket text,
  kisi_baslik text,
  kisi_unvan text,
  kisi_metin text,
  -- kapaklar kovasındaki dosya yolu; tek fotoğraf alanı
  kisi_gorsel text,

  -- Akademi bölümü
  akademi_etiket text,
  akademi_baslik text,
  akademi_metin text,

  updated_at timestamptz not null default now()
);

insert into public.hakkimizda_icerik (
  id,
  hero_etiket, hero_baslik, hero_vurgu, hero_metin,
  kisi_etiket, kisi_baslik, kisi_unvan, kisi_metin,
  akademi_etiket, akademi_baslik, akademi_metin
)
values (
  true,
  'Hakkımızda',
  'Kurs satmıyoruz.',
  'Birlikte çalışıyoruz.',
  'Ahmet Ekinci Akademi, yeni medya temelleri üzerine kurulmuş bir eğitim programı. Kayıtlı kurs değil: gerçek zamanlı, tek katılımcıya göre kurulan müfredat.',
  'Eğitmen',
  'Ahmet Ekinci kimdir?',
  'Dijital pazarlama eğitmeni · Ankara',
  'Ahmet Ekinci, Yeni Medya ve İletişim lisans mezunu. 2018''den beri dijital medya alanında çalışıyor ve markaların çözüm ortağı oluyor.

2021''de TRT Geleceğin İletişimcileri yarışmasına kendi Instagram projesiyle "Sosyal Medya Yönetimi" kategorisinde katıldı ve üçüncülük ödülünü kazandı.

Yine 2021''den bu yana birebir ve kişiye özel eğitimlerle yüzlerce katılımcıyla bir araya geldi.

Şu anda Ankara''da dijital medya çalışmalarını, içerik üreticiliğini ve Ahmet Ekinci Akademi ile eğitimlerini sürdürüyor.',
  'Akademi',
  'Ahmet Ekinci Akademi',
  'Akademi "işi uzmanından öğren" mottosuyla hareket ediyor. Her katılımcının başlangıç noktası, işi ve öğrenme hızı farklı; bu yüzden programlar esnek ve kişiselleştirilebilir kuruluyor.'
)
on conflict (id) do nothing;

alter table public.hakkimizda_icerik enable row level security;

-- Ziyaretçi okur: sayfanın kendisi herkese açık.
create policy hakkimizda_icerik_herkes_okur on public.hakkimizda_icerik
  for select to anon, authenticated using (true);

create policy hakkimizda_icerik_admin_update on public.hakkimizda_icerik
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.hakkimizda_icerik to anon, authenticated;
grant update on public.hakkimizda_icerik to authenticated;
