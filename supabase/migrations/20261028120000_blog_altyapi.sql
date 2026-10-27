-- Blog altyapısı (Faz 1): zamanlı yayın, sürüm geçmişi, yönlendirme tablosu.
--
-- Kaynak: ahmetekinci.com.tr'nin blog sistemi (blog_schema, blog_revisions,
-- blog_auto_redirects). Mantık oradan; tablo ve kolon adları bu projenin
-- mevcut `posts` / `categories` tablolarına uyarlandı. Yazılar yeni bir
-- tabloya TAŞINMIYOR, mevcut tablo genişletiliyor: 22 yazının adresi, kimliği
-- ve içeriği olduğu gibi kalıyor.

/* ------------------------------------------------------- zamanlı yayın --- */

-- 'zamanli': yayın saati gelince zamanlayıcının kendiliğinden yayına aldığı
-- yazı. Herkese açık okuma politikası değişmiyor (durum = 'yayin'), yani
-- zamanlı yazı vakti gelene kadar sitede görünmüyor.
alter table public.posts drop constraint if exists posts_durum_check;
alter table public.posts
  add constraint posts_durum_check check (durum in ('taslak', 'yayin', 'zamanli'));

alter table public.posts add column if not exists zamanlanan_tarih timestamptz;
alter table public.posts drop constraint if exists posts_zamanli_tarih_check;
alter table public.posts
  add constraint posts_zamanli_tarih_check check (durum <> 'zamanli' or zamanlanan_tarih is not null);

comment on column public.posts.zamanlanan_tarih is
  'Zamanlı yazının yayına gireceği an. Yalnız durum=zamanli iken dolu; yayına girince yayin_tarihi olur.';

/*
  Yazı bir kez bile yayında kaldı mı?

  Otomatik yönlendirmenin şartı bu: hiç yayınlanmamış bir taslağın adresini
  Google bilmiyor, adresi değişince ya da silinince yönlendirme yazmak tabloyu
  çöple doldurur. yayin_tarihi bunun için yeterli değil: panelde taslağa da
  ileri bir tarih girilebiliyor.
*/
alter table public.posts add column if not exists hic_yayinlandi boolean not null default false;
update public.posts set hic_yayinlandi = true where durum = 'yayin' and not hic_yayinlandi;

create index if not exists posts_zamanli_idx on public.posts (zamanlanan_tarih) where durum = 'zamanli';

create or replace function public.posts_yazmadan_once()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.durum <> 'zamanli' then
    new.zamanlanan_tarih := null;
  end if;
  if new.durum = 'yayin' then
    new.hic_yayinlandi := true;
    -- Yayına alınan yazının tarihi boşsa şimdi (panel de böyle yapıyor;
    -- burada da olması REST'ten gelen yazmayı aynı kurala bağlıyor).
    if new.yayin_tarihi is null then
      new.yayin_tarihi := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists posts_yazmadan_once on public.posts;
create trigger posts_yazmadan_once
  before insert or update on public.posts
  for each row execute function public.posts_yazmadan_once();

/*
  Vakti gelen zamanlı yazıları yayına alır; yayına girenlerin adresini ve
  kategorisini döndürür (çağıran uç, o sayfaları tazeliyor).

  Yayın tarihi zamanlanan an oluyor, görevin çalıştığı an değil: görev bir
  dakika gecikse de yazı ilan edilen saatte yayınlanmış görünür.

  Çağırma yetkisi yalnız service_role'da: /api/gorevler/blog-zamanli-yayin.
*/
create or replace function public.zamani_gelen_yazilari_yayinla()
returns table (slug text, kategori_slug text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with yayinlanan as (
    update public.posts p
       set durum = 'yayin',
           yayin_tarihi = p.zamanlanan_tarih,
           updated_at = now()
     where p.durum = 'zamanli'
       and p.zamanlanan_tarih <= now()
    returning p.slug, p.kategori_id
  )
  select y.slug, c.slug
    from yayinlanan y
    left join public.categories c on c.id = y.kategori_id;
end;
$$;

revoke execute on function public.zamani_gelen_yazilari_yayinla() from public, anon, authenticated;
grant execute on function public.zamani_gelen_yazilari_yayinla() to service_role;

/* ------------------------------------------------------ sürüm geçmişi --- */

/*
  Yazının önceki hâlleri.

  Başlık, özet ya da içerik her değiştiğinde ESKİ hâl buraya yazılıyor
  (tetikleyici, uygulama değil: hangi yoldan kaydedilirse kaydedilsin geçmiş
  tutulur). Geri yüklemek editörde eski hâli açıp normal kaydetmek; o kayıt
  da şimdiki hâli buraya yazıyor, yani geri yükleme de geri alınabilir.

  Yazı başına son 100 sürüm tutuluyor.
*/
create table if not exists public.post_surumleri (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  baslik text not null,
  ozet text not null default '',
  icerik_html text not null default '',
  icerik_json jsonb not null default '{}'::jsonb,
  slug text not null,
  durum text not null,
  -- SEO alanlarının o anki hâli (seo_baslik, seo_aciklama).
  seo jsonb not null default '{}'::jsonb,
  olusturan uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists post_surumleri_post_idx on public.post_surumleri (post_id, created_at desc);

alter table public.post_surumleri enable row level security;

create policy post_surumleri_admin_select on public.post_surumleri
  for select using (public.is_admin());
create policy post_surumleri_admin_delete on public.post_surumleri
  for delete using (public.is_admin());
-- INSERT politikası yok: satırları yalnız tetikleyici (security definer) yazıyor.

create or replace function public.posts_surum_kaydet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.baslik, old.ozet, old.icerik_html) is distinct from (new.baslik, new.ozet, new.icerik_html) then
    insert into public.post_surumleri (post_id, baslik, ozet, icerik_html, icerik_json, slug, durum, seo, olusturan)
    values (
      old.id, old.baslik, old.ozet, old.icerik_html, old.icerik_json, old.slug, old.durum,
      jsonb_build_object('seo_baslik', old.seo_baslik, 'seo_aciklama', old.seo_aciklama),
      auth.uid()
    );

    delete from public.post_surumleri
     where post_id = old.id
       and id in (
         select id from public.post_surumleri
          where post_id = old.id
          order by created_at desc
          offset 100
       );
  end if;
  return new;
end;
$$;

drop trigger if exists posts_surum_kaydet on public.posts;
create trigger posts_surum_kaydet
  after update on public.posts
  for each row execute function public.posts_surum_kaydet();

/* --------------------------------------------------- yönlendirmeler --- */

/*
  Adres yönlendirmeleri — ara katman (src/proxy.ts) okuyor.

  Elle yazılmış kalıcı taşıma listesi (src/lib/tasima.ts) yerinde duruyor;
  bu tablo panelden ve kendiliğinden yazılanlar için. Kaynak her zaman
  "/adres/" biçiminde (sitede trailingSlash açık).

  kod 301: hedefe kalıcı yönlendirme. kod 410: "bu içerik kalıcı olarak
  kaldırıldı" — hedef yok.

  otomatik: tetikleyicinin yazdığı satır (adres değişti, yazı kaldırıldı).
  Elle yazılanı tetikleyici ezmez, yalnızca kendi yazdığını günceller.
*/
create table if not exists public.yonlendirmeler (
  id uuid primary key default gen_random_uuid(),
  kaynak text not null unique,
  hedef text,
  kod smallint not null default 301,
  aktif boolean not null default true,
  otomatik boolean not null default false,
  post_id uuid references public.posts(id) on delete set null,
  notu text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yonlendirmeler_kaynak_bicim check (kaynak ~ '^/[^?#[:space:]]*/$' and length(kaynak) <= 300),
  constraint yonlendirmeler_hedef_bicim check (
    hedef is null or ((hedef ~ '^/[^[:space:]]*$' or hedef ~ '^https://[^[:space:]]+$') and length(hedef) <= 500)
  ),
  constraint yonlendirmeler_kod check (kod in (301, 410)),
  constraint yonlendirmeler_kod_hedef check ((kod = 410) = (hedef is null)),
  constraint yonlendirmeler_kendine check (hedef is distinct from kaynak)
);

create index if not exists yonlendirmeler_post_idx on public.yonlendirmeler (post_id);
create index if not exists yonlendirmeler_hedef_idx on public.yonlendirmeler (hedef);

alter table public.yonlendirmeler enable row level security;

-- Etkin yönlendirmeler gizli değil (her ziyaretçi zaten sonucunu görüyor);
-- ara katman anon anahtarıyla okuyor.
create policy yonlendirmeler_okuma on public.yonlendirmeler
  for select using (aktif or public.is_admin());
create policy yonlendirmeler_admin_insert on public.yonlendirmeler
  for insert with check (public.is_admin());
create policy yonlendirmeler_admin_update on public.yonlendirmeler
  for update using (public.is_admin());
create policy yonlendirmeler_admin_delete on public.yonlendirmeler
  for delete using (public.is_admin());

/** "/slug/" — yazı ve kategori arşivleri kökte. */
create or replace function public.blog_yolu(p_slug text)
returns text
language sql
immutable
as $$ select '/' || p_slug || '/' $$;

/*
  Otomatik yönlendirme yazar (yoksa ekler, varsa yalnız otomatik olanı
  günceller) ve zinciri düzler: eskiden p_kaynak'a giden her yönlendirme
  artık doğrudan p_hedef'e gidiyor. Düzlenmeseydi her adres değişikliği
  zincire bir halka ekler, Google birkaç sıçramadan sonra takibi bırakırdı.
*/
create or replace function public.yonlendirme_oto_yaz(p_kaynak text, p_hedef text, p_post uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kaynak = p_hedef then
    return;
  end if;

  insert into public.yonlendirmeler (kaynak, hedef, kod, otomatik, post_id)
  values (p_kaynak, p_hedef, 301, true, p_post)
  on conflict (kaynak) do update
     set hedef = excluded.hedef,
         kod = 301,
         aktif = true,
         post_id = coalesce(excluded.post_id, yonlendirmeler.post_id),
         updated_at = now()
   where yonlendirmeler.otomatik;

  update public.yonlendirmeler
     set hedef = p_hedef, updated_at = now()
   where hedef = p_kaynak
     and kaynak <> p_hedef;

  -- Düzleme bir satırı kendine yönlendirdiyse (A→B, B→A) o satır anlamsız.
  delete from public.yonlendirmeler where kaynak = p_hedef and otomatik;
end;
$$;

/*
  Yayından kalkan ya da silinen yazının varsayılan yönlendirmesi: /blog/.
  Önceden bir karar verilmişse (panelde "nereye yönlensin" seçildiyse) ona
  dokunmuyor.

  Bu adrese giden eski yönlendirmeler (yazının önceki adresleri) de aynı
  yere düzleniyor; yoksa ziyaretçi /eski/ → /simdiki/ → /blog/ diye iki kez
  sıçrardı.
*/
create or replace function public.yonlendirme_varsayilan_yaz(p_kaynak text, p_post uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_satir record;
begin
  insert into public.yonlendirmeler (kaynak, hedef, kod, otomatik, post_id)
  values (p_kaynak, '/blog/', 301, true, p_post)
  on conflict (kaynak) do nothing;

  select y.hedef, y.kod into v_satir from public.yonlendirmeler y where y.kaynak = p_kaynak and y.aktif;
  if found then
    update public.yonlendirmeler
       set hedef = v_satir.hedef, kod = v_satir.kod, updated_at = now()
     where hedef = p_kaynak
       and kaynak <> coalesce(v_satir.hedef, '');
  end if;
end;
$$;

revoke execute on function public.yonlendirme_oto_yaz(text, text, uuid) from public, anon, authenticated;
revoke execute on function public.yonlendirme_varsayilan_yaz(text, uuid) from public, anon, authenticated;

/*
  Yazı tetikleyicisi.

    * Yayındaki yazı: kendi adresini gölgeleyen yönlendirme silinir; yazı
      yayından kalkarken eski adresleri için ne karar verildiyse (/blog/,
      başka yazı, 410) hepsi yeniden yazının kendisine döner.
    * Adres değişti (yazı bir kez bile yayınlandıysa): eski adres yeni
      adrese — yazı şu an yayında değilse /blog/'a; yayına dönünce yukarıdaki
      kural onu yazıya çeviriyor.
    * Yayından kalktı: adresi /blog/'a (karar verilmediyse).
*/
create or replace function public.posts_yonlendirme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yeni text := public.blog_yolu(new.slug);
  v_canli boolean := new.durum = 'yayin';
begin
  if tg_op = 'UPDATE' and old.slug <> new.slug and old.hic_yayinlandi then
    perform public.yonlendirme_oto_yaz(
      public.blog_yolu(old.slug),
      case when v_canli then v_yeni else '/blog/' end,
      new.id
    );
  end if;

  if v_canli then
    delete from public.yonlendirmeler where kaynak = v_yeni;
    -- Yazının eski adreslerine (otomatik yazılanlar) yazı yayından kalkarken
    -- ne karar verildiyse verilsin, yazı geri geldiyse hepsi yeniden ona.
    update public.yonlendirmeler
       set hedef = v_yeni, kod = 301, aktif = true, updated_at = now()
     where post_id = new.id
       and otomatik
       and kaynak <> v_yeni;
  elsif tg_op = 'UPDATE' and old.durum = 'yayin' then
    perform public.yonlendirme_varsayilan_yaz(v_yeni, new.id);
  end if;

  return null;
end;
$$;

drop trigger if exists posts_yonlendirme on public.posts;
create trigger posts_yonlendirme
  after insert or update on public.posts
  for each row execute function public.posts_yonlendirme();

-- Silme: BEFORE, çünkü yazının kimliğine sonradan bağlanacak bir satır yok
-- (post_id on delete set null) ama adres o an hâlâ okunabiliyor.
create or replace function public.posts_silinirken_yonlendirme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.hic_yayinlandi then
    perform public.yonlendirme_varsayilan_yaz(public.blog_yolu(old.slug), null);
  end if;
  return old;
end;
$$;

drop trigger if exists posts_silinirken_yonlendirme on public.posts;
create trigger posts_silinirken_yonlendirme
  before delete on public.posts
  for each row execute function public.posts_silinirken_yonlendirme();

/*
  Kategori arşivleri de kökte (/sosyal-medya/) ve Google'da dizinli. Adresi
  değişen kategorinin eski adresi yenisine, silinen kategorininki /blog/'a.
*/
create or replace function public.categories_yonlendirme()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.yonlendirme_varsayilan_yaz(public.blog_yolu(old.slug), null);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.slug <> new.slug then
    perform public.yonlendirme_oto_yaz(public.blog_yolu(old.slug), public.blog_yolu(new.slug), null);
  end if;
  delete from public.yonlendirmeler where kaynak = public.blog_yolu(new.slug);
  return new;
end;
$$;

drop trigger if exists categories_yonlendirme on public.categories;
create trigger categories_yonlendirme
  after insert or update of slug on public.categories
  for each row execute function public.categories_yonlendirme();

drop trigger if exists categories_silinirken_yonlendirme on public.categories;
create trigger categories_silinirken_yonlendirme
  before delete on public.categories
  for each row execute function public.categories_yonlendirme();

/*
  Hedefi zincir boyunca çözer: hedef de bir yönlendirmenin kaynağıysa onun
  hedefine gider (en çok 10 adım). 410'a varan zincir 410 olur.
*/
create or replace function public.yonlendirme_hedefi_coz(
  p_hedef text,
  out cozulen_hedef text,
  out cozulen_kod smallint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_satir record;
  v_adim int := 0;
begin
  cozulen_hedef := p_hedef;
  cozulen_kod := 301;
  loop
    select y.hedef, y.kod into v_satir
      from public.yonlendirmeler y
     where y.kaynak = cozulen_hedef and y.aktif;
    exit when not found or v_adim >= 10;
    if v_satir.kod = 410 then
      cozulen_hedef := null;
      cozulen_kod := 410;
      return;
    end if;
    cozulen_hedef := v_satir.hedef;
    v_adim := v_adim + 1;
  end loop;
end;
$$;

revoke execute on function public.yonlendirme_hedefi_coz(text) from public, anon, authenticated;

/*
  Yayından kaldırılan ya da silinecek yazının yönlendirme kararı (panelden).

  p_kod 301 + p_hedef: o adrese. p_kod 410: kalıcı olarak kaldırıldı.
  Yazının şimdiki adresi ve daha önce "/blog/'a" diye otomatik yazılmış eski
  adresleri birlikte bu karara geçiyor.

  Yayındaki yazıya uygulanmıyor: canlı adres yönlendirilemez.
*/
create or replace function public.yazi_yonlendirme_karari(p_post uuid, p_kod int, p_hedef text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yazi record;
  v_kaynak text;
  v_cozum record;
  v_hedef text;
  v_kod smallint;
begin
  if not public.is_admin() then
    raise exception 'Yetkisiz.' using errcode = '42501';
  end if;
  if p_kod not in (301, 410) then
    raise exception 'Geçersiz yönlendirme kodu.';
  end if;

  select id, slug, durum into v_yazi from public.posts where id = p_post;
  if not found then
    raise exception 'Yazı bulunamadı.';
  end if;
  if v_yazi.durum = 'yayin' then
    raise exception 'Yayındaki yazının adresi yönlendirilemez.';
  end if;

  v_kaynak := public.blog_yolu(v_yazi.slug);

  if p_kod = 410 then
    v_hedef := null;
    v_kod := 410;
  else
    if p_hedef is null or btrim(p_hedef) = '' then
      raise exception 'Hedef adres gerekli.';
    end if;
    select * into v_cozum from public.yonlendirme_hedefi_coz(btrim(p_hedef));
    v_hedef := v_cozum.cozulen_hedef;
    v_kod := v_cozum.cozulen_kod;
    if v_hedef = v_kaynak then
      raise exception 'Yazı kendi adresine yönlendirilemez.';
    end if;
  end if;

  insert into public.yonlendirmeler (kaynak, hedef, kod, otomatik, post_id)
  values (v_kaynak, v_hedef, v_kod, true, p_post)
  on conflict (kaynak) do update
     set hedef = excluded.hedef,
         kod = excluded.kod,
         aktif = true,
         otomatik = true,
         post_id = excluded.post_id,
         updated_at = now();

  update public.yonlendirmeler
     set hedef = v_hedef, kod = v_kod, updated_at = now()
   where post_id = p_post
     and otomatik
     and kaynak <> v_kaynak
     and kod = 301
     and hedef = '/blog/';

  -- Bu adrese giden başka yönlendirmeler de düzlensin.
  update public.yonlendirmeler
     set hedef = v_hedef, kod = v_kod, updated_at = now()
   where hedef = v_kaynak
     and kaynak <> coalesce(v_hedef, '');
end;
$$;

revoke execute on function public.yazi_yonlendirme_karari(uuid, int, text) from public, anon;
grant execute on function public.yazi_yonlendirme_karari(uuid, int, text) to authenticated;

/* ----------------------------------------------------- zamanlayıcı --- */

/*
  Zamanlı yayın görevi: her dakika bakıyor, ama yalnız vakti gelmiş bir yazı
  VARSA siteyi çağırıyor. Boş dakikalarda dışarıya hiç istek gitmiyor.
*/
select cron.unschedule('blog-zamanli-yayin')
where exists (select 1 from cron.job where jobname = 'blog-zamanli-yayin');

select cron.schedule(
  'blog-zamanli-yayin',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://panel.ahmetekinciakademi.com/api/gorevler/blog-zamanli-yayin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-gorev-anahtari', private.gorev_anahtari()
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  where exists (
    select 1 from public.posts where durum = 'zamanli' and zamanlanan_tarih <= now()
  );
  $$
);
