-- iyzico ile online tahsilat.
--
-- Akış: yönetici ödemeyi "bekliyor" olarak tanımlar, öğrenci panelden kartıyla
-- öder. Kart verisi bu sunucudan hiç geçmiyor — öğrenci iyzico'nun kendi ödeme
-- sayfasına gidiyor (Checkout Form), 3D Secure orada tamamlanıyor. Kart verisi
-- hiç dokunmadığımız için PCI-DSS yükümlülüğü de bize düşmüyor; kart alanlarını
-- kendi formumuza koyduğumuz anda düşerdi.

alter table public.payments
  add column if not exists online_odeme boolean not null default true;

comment on column public.payments.online_odeme is
  'false ise öğrenci bu kaydı panelden kartla ödeyemez (havaleyle anlaşılmış kayıtlar).';

-- Ödeme denemesi ile ödemenin kendisi ayrı şeyler: bir kayıt için kart
-- reddedilip yeniden denenebiliyor. Hepsini payments üzerine yazsaydık ya
-- geçmiş kaybolurdu ya da her başarısız denemede sahte bir ödeme satırı olurdu.
create table if not exists public.odeme_denemeleri (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- iyzico'ya gönderdiğimiz kimlik. Geri dönen kaydı buna göre eşliyoruz;
  -- token'a güvenmek yetmiyor, hangi ödemeye ait olduğunu o söylemiyor.
  conversation_id text not null unique,
  token text,
  tutar numeric(12, 2) not null,
  durum text not null default 'baslatildi'
    check (durum in ('baslatildi', 'basarili', 'basarisiz')),
  saglayici_odeme_id text,
  taksit int,
  kart_son4 text,
  kart_ailesi text,
  hata_kodu text,
  hata_mesaji text,
  -- Uyuşmazlıkta iyzico'nun ne dediğinin tek kanıtı. Özetlediğimiz alanlar
  -- yetmediğinde (fraud durumu, komisyon, kart bankası) buraya bakılıyor.
  ham_yanit jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists odeme_denemeleri_payment_idx
  on public.odeme_denemeleri (payment_id, created_at desc);
create index if not exists odeme_denemeleri_user_idx
  on public.odeme_denemeleri (user_id, created_at desc);

alter table public.odeme_denemeleri enable row level security;

drop policy if exists "odeme denemeleri okunur" on public.odeme_denemeleri;
create policy "odeme denemeleri okunur" on public.odeme_denemeleri
  for select to authenticated
  using (user_id = (select auth.uid()) or (select is_admin()));

-- YAZMA POLİTİKASI BİLEREK YOK.
--
-- Satırları yalnızca sunucudaki servis anahtarı yazıyor (RLS'i atlar).
-- Kullanıcıya insert/update açmak, kendi ödemesine "basarili" yazabilmesi
-- demek olurdu — ve o satır ödemeyi "odendi"ye çeviren şey.
revoke all on public.odeme_denemeleri from anon, authenticated;
grant select on public.odeme_denemeleri to authenticated;
grant all on public.odeme_denemeleri to service_role;

-- online_odeme yeni bir sütun; sütun bazlı grant verilmiş bir kurulumda
-- öğrenci onu okuyamaz ve "Kartla öde" düğmesi hiç çıkmaz. Tablo düzeyinde
-- veriyoruz: satır sınırı zaten payments_select_own_or_admin'de.
grant select on public.payments to authenticated;

create or replace function public.odeme_denemesi_damgasi()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.odeme_denemesi_damgasi() from public, anon, authenticated;

drop trigger if exists odeme_denemesi_updated_at on public.odeme_denemeleri;
create trigger odeme_denemesi_updated_at before update on public.odeme_denemeleri
  for each row execute function public.odeme_denemesi_damgasi();
