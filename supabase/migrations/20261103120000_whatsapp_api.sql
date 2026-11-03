-- WhatsApp Cloud API (coexistence): bağlantı ayarı, kişiler, mesajlar ve
-- tıklama kaydının WhatsApp numarasıyla eşleşmesi.
--
-- Tekrar çalıştırılabilir (if not exists / drop if exists). Mevcut kodla
-- uyumlu: temaslar'a eklenen kolonlar boş geliyor, eski kod okumuyor.
--
-- Yazma yalnızca servis anahtarıyla (webhook ucu ve yönetici eylemleri),
-- okuma yalnızca yöneticide — temaslar tablosuyla aynı kural. Mesaj
-- içerikleri kişisel veri: anon ve öğrenci rolü hiçbir satırı göremiyor.

/* ------------------------------------------------------ bağlantı ayarı --- */

/*
  Tek satır (id = true). Gizli değer YOK: erişim anahtarı ve uygulama gizli
  anahtarı yalnızca Vercel ortam değişkenlerinde. Burada yalnızca Meta'nın
  herkese açık kimlikleri ve bağlantı penceresinin ayarı duruyor; panelden
  girilebilsin diye veritabanında (yeni bir deploy gerekmesin).
*/
create table if not exists public.whatsapp_baglanti (
  id boolean primary key default true check (id),
  /* Meta uygulama kimliği (App ID) — gizli değil, JS SDK'ya veriliyor. */
  app_id text,
  /* Embedded Signup yapılandırma kimliği (Configuration ID). */
  es_config_id text,
  waba_id text,
  telefon_numara_id text,
  gorunen_numara text,
  dogrulanmis_ad text,
  /* Telefondaki WhatsApp Business uygulamasıyla birlikte mi (coexistence)? */
  uygulamayla_birlikte boolean not null default false,
  baglanma_zamani timestamptz,
  /* Kişi ve geçmiş senkronizasyonu istekleri: { kisiler, gecmis } → request_id ya da hata. */
  senkron jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_baglanti enable row level security;
drop policy if exists whatsapp_baglanti_admin_select on public.whatsapp_baglanti;
create policy whatsapp_baglanti_admin_select on public.whatsapp_baglanti
  for select using (is_admin());

/* -------------------------------------------------------------- kişiler --- */

create table if not exists public.whatsapp_kisiler (
  /* WhatsApp numarası, ülke kodlu rakamlar (905321234567). */
  wa_id text primary key,
  ad text,
  ilk_mesaj timestamptz,
  son_mesaj timestamptz,
  /* Mesajdaki takip kodu (Ref: ...) — temaslar.kod. */
  temas_kodu text,
  /* Tıkla-WhatsApp'a reklamından geldiyse reklam tıklama kimliği. */
  ctwa_clid text,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_kisiler_son_mesaj_idx on public.whatsapp_kisiler (son_mesaj desc);

alter table public.whatsapp_kisiler enable row level security;
drop policy if exists whatsapp_kisiler_admin_select on public.whatsapp_kisiler;
create policy whatsapp_kisiler_admin_select on public.whatsapp_kisiler
  for select using (is_admin());

/* ------------------------------------------------------------- mesajlar --- */

create table if not exists public.whatsapp_mesajlar (
  id uuid primary key default gen_random_uuid(),
  /* Meta'nın mesaj kimliği (wamid...). Webhook aynı mesajı birden çok kez
     gönderebiliyor; benzersizlik tekrarı sessizce eliyor. */
  wa_mesaj_id text not null unique,
  /* gelen: kişiden; giden: bizden (panelden ya da telefondaki uygulamadan). */
  yon text not null check (yon in ('gelen', 'giden')),
  /* Karşı tarafın numarası — wa_kisiler.wa_id. */
  wa_id text not null,
  telefon_numara_id text,
  tur text not null,
  metin text,
  zaman timestamptz not null,
  temas_kodu text,
  ctwa_clid text,
  referral jsonb,
  ham jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_mesajlar_wa_id_zaman_idx on public.whatsapp_mesajlar (wa_id, zaman desc);
create index if not exists whatsapp_mesajlar_zaman_idx on public.whatsapp_mesajlar (zaman desc);

alter table public.whatsapp_mesajlar enable row level security;
drop policy if exists whatsapp_mesajlar_admin_select on public.whatsapp_mesajlar;
create policy whatsapp_mesajlar_admin_select on public.whatsapp_mesajlar
  for select using (is_admin());

/* ------------------------------------------- tıklama ↔ WhatsApp eşleşmesi --- */

/*
  Takip kodlu ilk mesaj geldiğinde temas kaydına kişinin WhatsApp numarası
  yazılıyor. Hesap aynı telefonla açıldığında tıklama kimliği kişiye
  kendiliğinden bağlanıyor — panele elle kod yapıştırma yedek olarak kalıyor.
*/
alter table public.temaslar add column if not exists wa_id text;
alter table public.temaslar add column if not exists wa_eslesme_zamani timestamptz;
create index if not exists temaslar_wa_id_idx on public.temaslar (wa_id) where wa_id is not null;

comment on table public.whatsapp_mesajlar is
  'WhatsApp Cloud API webhook''undan gelen ve giden mesajlar. Yazma yalnız servis anahtarıyla; okuma yalnız yönetici.';
