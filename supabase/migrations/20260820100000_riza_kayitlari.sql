-- Onay (rıza) kayıtları: kim, neyi, ne zaman kabul etti.
--
-- Şimdiye kadar tek kanıt profiles.sozlesme_onayi_tarihi idi: tek bir damga,
-- hangi metne ait olduğu yazmıyor. Ödeme ekranındaki mesafeli satış onayı ise
-- hiç kaydedilmiyordu — kutucuk yalnızca tarayıcıda duruyor, işaretlendiği an
-- hiçbir yere yazılmıyordu. Bir uyuşmazlıkta elimizde "kabul etmiş olmalı"dan
-- başka bir şey yoktu.
--
-- Tablo dört soruya birden cevap veriyor:
--   kim      → user_id
--   neyi     → belge + belge_basligi + belge_ozeti
--   ne zaman → created_at (sunucu saati)
--   nereden  → ip + tarayici
--
-- belge_ozeti neden var: yasal metinler panelden düzenlenebiliyor. Metin
-- yarın değişirse bugün verilen onay hâlâ ESKİ metne ait. Yalnızca slug
-- saklasaydık kayıt, sonradan yazılmış bir metne işaret ederdi. Özet (SHA-256)
-- o anki metnin parmak izi: hangi sürümün kabul edildiği ispatlanabilir
-- kalıyor, metnin tamamını her onayda kopyalamadan.

create table if not exists public.riza_kayitlari (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- yasal_sayfalar.slug ile eşleşiyor ama FK verilmedi: bir metin silinse
  -- bile verilmiş onayın kaydı durmalı.
  belge text not null,
  -- Onayın alındığı yer: 'kayit', 'odeme', 'gorusme'.
  baglam text not null,
  belge_basligi text,
  /* Onaylanan sürümün yayın tarihi ve metnin SHA-256 özeti. */
  belge_guncelleme timestamptz,
  belge_ozeti text,
  payment_id uuid references public.payments(id) on delete set null,
  ip inet,
  tarayici text,
  created_at timestamptz not null default now()
);

comment on table public.riza_kayitlari is
  'KVKK ve 6502 kapsamında verilen onayların zaman damgalı kaydı. Yalnızca sunucu yazar.';
comment on column public.riza_kayitlari.belge_ozeti is
  'Onaylanan metnin SHA-256 özeti. Metin sonradan değişse de hangi sürümün kabul edildiği bulunabilsin.';

alter table public.riza_kayitlari enable row level security;

/*
  Okuma kişinin kendisine ve yöneticiye açık.

  YAZMA HİÇ KİMSEYE AÇIK DEĞİL — insert/update/delete politikası yok ve yetki
  verilmiyor. Kayıtları yalnızca sunucu, servis anahtarıyla atıyor. Sebep
  doğrudan kaydın değeriyle ilgili: tarayıcıdan yazılabilen bir onay kaydı
  hiçbir şey ispat etmez. Kullanıcı kendi satırını ekleyebilse tarihi, IP'yi
  ve hangi metni onayladığını kendi seçerdi; silebilse de kaydı ortadan
  kaldırırdı.
*/
drop policy if exists riza_select_own_or_admin on public.riza_kayitlari;
create policy riza_select_own_or_admin on public.riza_kayitlari
  for select using ((user_id = (select auth.uid())) or is_admin());

grant select on public.riza_kayitlari to authenticated;

create index if not exists riza_kayitlari_user_idx
  on public.riza_kayitlari (user_id, created_at desc);

/*
  Kayıt sırasındaki onay.

  Trigger içinden yazılıyor çünkü hesap o an açılıyor ve profiles satırı
  henüz yok — sunucu eylemi olarak yazmaya kalksak sıralamaya bağımlı,
  kaçırılabilir bir adım olurdu.

  IP burada boş kalıyor: trigger'ın istek başlıklarına erişimi yok. Onayın
  kendisi ve zamanı sunucu saatiyle damgalı, sürüm özeti de alınıyor; IP
  ispatın zorunlu parçası değil, güçlendiricisi.
*/
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ileti boolean := coalesce((new.raw_user_meta_data->>'ileti_izni')::boolean, false);
  v_sozlesme boolean := coalesce((new.raw_user_meta_data->>'sozlesme_onayi')::boolean, false);
begin
  -- email UNUTULMAMALI: auth.users RLS altında okunamıyor, admin listeleri ve
  -- öğrenciye giden bildirimlerin alıcısı bu aynadan geliyor. Bu satır bir kez
  -- düşürüldü ve o tarihten sonra açılan hesaplarda mail sessizce gitmedi
  -- (bkz. 20260818140000_profil_eposta_aynasini_onar.sql).
  insert into public.profiles (id, ad, soyad, email, telefon, sozlesme_onayi_tarihi, ileti_izni, ileti_izni_tarihi)
  values (
    new.id,
    new.raw_user_meta_data->>'ad',
    new.raw_user_meta_data->>'soyad',
    new.email,
    nullif(new.raw_user_meta_data->>'telefon', ''),
    case when v_sozlesme then now() end,
    v_ileti,
    case when v_ileti then now() end
  );

  if v_sozlesme then
    insert into public.riza_kayitlari (user_id, belge, baglam, belge_basligi, belge_guncelleme, belge_ozeti)
    select
      new.id,
      y.slug,
      'kayit',
      y.baslik,
      y.guncelleme,
      -- sha256() yerleşik (PG11+); pgcrypto'nun digest'i extensions şemasında
      -- ve fonksiyonun search_path'i yalnızca public — orayı göremezdi.
      encode(sha256(convert_to(coalesce(y.icerik, ''), 'UTF8')), 'hex')
    from public.yasal_sayfalar y
    where y.slug in ('uyelik-sozlesmesi', 'kisisel-verilerin-islenmesi');
  end if;

  -- Ticari elektronik ileti izni ayrı bir rıza: 6563 sayılı Kanun bunu
  -- sözleşmeden bağımsız, açık ve ayrı bir onay olarak istiyor. Bir yasal
  -- metne bağlı olmadığı için belge alanı kendi adıyla yazılıyor.
  if v_ileti then
    insert into public.riza_kayitlari (user_id, belge, baglam, belge_basligi)
    values (new.id, 'ticari-ileti-izni', 'kayit', 'Ticari elektronik ileti izni');
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
