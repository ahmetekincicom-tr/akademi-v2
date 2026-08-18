-- Danışmanlık görüşmelerinde eğitim kaydı / ödeme ayrımı.
--
-- Bugüne kadar panele giren HERKESİN üç ücretsiz görüşme hakkı vardı ve hak
-- bitince talep yine oluşuyor, yalnızca "ödeme bekliyor" olarak işaretleniyordu.
-- Yani eğitime hiç katılmamış biri de ücretsiz görüşme alabiliyor, ödemeden de
-- talep açabiliyordu.
--
-- Yeni kural:
--   * Eğitim kaydı OLAN  → ilk 3 görüşme ücretsiz, doğrudan talep açılır.
--   * Eğitim kaydı OLMAYAN → ücretsiz hak yok; talep ancak ödeme tamamlanınca
--     gerçek bir talebe dönüşür.
--
-- Ödeme öncesi satır neden var: form içeriği (konu, açıklama, tercih edilen
-- zaman) ödeme sağlayıcısına gidip geri dönene kadar bir yerde durmak zorunda.
-- Bu satır 'odeme_bekliyor' durumunda bekliyor ve yönetim tarafında iş kuyruğuna
-- girmiyor; ödeme onaylanınca 'talep' oluyor.

/* --------------------------------------------------- eğitim kaydı var mı --- */

create or replace function public.egitime_katildi_mi(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- İptal edilmiş kayıt sayılmıyor; 'aktif' ve 'tamamlandi' sayılıyor.
  select exists (
    select 1 from public.enrollments
    where user_id = p_user and durum <> 'iptal'
  );
$$;

comment on function public.egitime_katildi_mi(uuid) is
  'Kişinin iptal edilmemiş en az bir eğitim kaydı var mı. Ücretsiz görüşme hakkının koşulu.';

revoke execute on function public.egitime_katildi_mi(uuid) from public, anon;
grant execute on function public.egitime_katildi_mi(uuid) to authenticated;

/* ------------------------------------------------ görüşme ↔ ödeme bağlantısı */

alter table public.gorusmeler
  add column if not exists payment_id uuid references public.payments(id) on delete set null;

comment on column public.gorusmeler.payment_id is
  'Ücretli görüşmenin ödeme kaydı. Ödeme onaylandığında tetikleyici görüşmeyi talebe çeviriyor.';

create index if not exists gorusmeler_payment_id_idx
  on public.gorusmeler (payment_id) where payment_id is not null;

/* ------------------------------------------------------------ talep açma --- */

create or replace function public.gorusme_talep_olustur(
  p_konu text,
  p_aciklama text default null,
  p_tercih_zaman text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ayar gorusme_ayarlari%rowtype;
  v_kullanilan int;
  v_ucretsiz boolean;
  v_katildi boolean;
  v_payment uuid;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Oturum bulunamadı';
  end if;
  if coalesce(btrim(p_konu), '') = '' then
    raise exception 'Görüşme konusu zorunludur';
  end if;

  select * into v_ayar from gorusme_ayarlari where id;
  if not v_ayar.aktif then
    raise exception 'Görüşme talepleri şu anda kapalı';
  end if;

  -- Tek seferde tek bekleyen talep: sıraya girmiş kopyaları önler.
  if exists (
    select 1 from gorusmeler
    where user_id = v_user and durum in ('talep', 'odeme_bekliyor')
  ) then
    raise exception 'Zaten bekleyen bir görüşme talebin var';
  end if;

  v_katildi := egitime_katildi_mi(v_user);

  -- Ücretsiz hak yalnızca eğitime katılmış kişilerde. İptal edilen görüşme
  -- hak yakmaz.
  if v_katildi then
    select count(*) into v_kullanilan
    from gorusmeler
    where user_id = v_user and ucretsiz and durum <> 'iptal';
    v_ucretsiz := v_kullanilan < v_ayar.ucretsiz_hak;
  else
    v_ucretsiz := false;
  end if;

  -- Ücretli yolda önce ödeme kaydı: tutar buradan, istemciden gelen hiçbir
  -- değerden değil.
  if not v_ucretsiz then
    if coalesce(v_ayar.ucret, 0) <= 0 then
      raise exception 'Görüşme ücreti tanımlı değil, talep oluşturulamıyor';
    end if;

    insert into payments (user_id, tutar, durum, yontem, admin_notu, online_odeme)
    values (
      v_user,
      v_ayar.ucret,
      'bekliyor',
      null,
      'Danışmanlık görüşmesi',
      true
    )
    returning id into v_payment;
  end if;

  insert into gorusmeler (
    user_id, konu, aciklama, tercih_zaman, ucretsiz, ucret, sure_dk, durum, payment_id
  )
  values (
    v_user,
    btrim(p_konu),
    nullif(btrim(coalesce(p_aciklama, '')), ''),
    nullif(btrim(coalesce(p_tercih_zaman, '')), ''),
    v_ucretsiz,
    case when v_ucretsiz then null else v_ayar.ucret end,
    v_ayar.sure_dk,
    case when v_ucretsiz then 'talep'::gorusme_durum else 'odeme_bekliyor'::gorusme_durum end,
    v_payment
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.gorusme_talep_olustur(text, text, text) from public, anon;
grant execute on function public.gorusme_talep_olustur(text, text, text) to authenticated;

/* ------------------------------------------- ödeme onaylanınca talebe geç --- */

/*
  Tetikleyici, uygulama kodunda değil.

  Ödeme üç ayrı yoldan onaylanabiliyor: iyzico dönüş isteği, mutabakat görevi
  ve yöneticinin panelden elle işaretlemesi. Üçü de sonunda aynı şeyi yapıyor —
  payments.durum'u 'odendi' yazıyor. Kuralı buraya koymak üçünü birden
  kapsıyor; koda koymak üç ayrı yere aynı şeyi yazmak ve birini unutmak olurdu.
*/
create or replace function public.gorusme_odeme_tamamlandi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.durum = 'odendi' and old.durum is distinct from 'odendi' then
    update gorusmeler
    set odendi = true,
        odendi_at = now(),
        odeme_yontemi = coalesce(new.yontem, odeme_yontemi),
        durum = case when durum = 'odeme_bekliyor' then 'talep'::gorusme_durum else durum end
    where payment_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists payments_gorusme_tamamla on public.payments;
create trigger payments_gorusme_tamamla
  after update of durum on public.payments
  for each row execute function public.gorusme_odeme_tamamlandi();

/* --------------------------------------------------- ödenmemişi iptal et --- */

/*
  Öğrenci ödemeden vazgeçerse bekleyen satır yolu tıkıyor: "zaten bekleyen bir
  talebin var" kontrolü yüzünden yeni talep açamıyor. İptal, ödeme kaydını da
  kapatıyor.
*/
create or replace function public.gorusme_iptal(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_sahip uuid;
  v_durum gorusme_durum;
  v_payment uuid;
begin
  if v_user is null then
    raise exception 'Oturum bulunamadı';
  end if;

  -- Yetki ve durum kontrolleri özgün hâliyle korunuyor; eklenen tek şey
  -- ödenmemiş ödeme kaydının da kapatılması.
  select user_id, durum, payment_id into v_sahip, v_durum, v_payment
  from gorusmeler where id = p_id;

  if v_sahip is null then
    raise exception 'Görüşme bulunamadı';
  end if;
  if v_sahip <> v_user and not public.is_admin() then
    raise exception 'Bu görüşmeyi iptal etme yetkin yok';
  end if;
  if v_durum not in ('talep', 'odeme_bekliyor') and not public.is_admin() then
    raise exception 'Planlanmış görüşmeyi iptal etmek için bize ulaş';
  end if;

  update gorusmeler
  set durum = 'iptal', updated_at = now()
  where id = p_id;

  -- Yalnızca henüz ödenmemiş kayıt kapatılıyor. Ödenmiş bir görüşmenin
  -- ödemesine dokunulmuyor: iade ayrı bir karar ve elle veriliyor.
  if v_payment is not null then
    update payments set durum = 'iade'
    where id = v_payment and durum = 'bekliyor';
  end if;
end;
$$;

revoke execute on function public.gorusme_iptal(uuid) from public, anon;
grant execute on function public.gorusme_iptal(uuid) to authenticated;
