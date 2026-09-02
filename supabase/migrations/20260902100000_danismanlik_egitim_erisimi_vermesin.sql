-- Danışmanlık ödemesi EĞİTİM erişimi açmıyor.
--
-- Hata: egitim_erisimim() "ödenmiş bir payments satırı var mı" diye
-- soruyordu. Danışmanlık görüşmesi de payments'a yazılıyor — yani yalnızca
-- danışmanlık alan, hiçbir eğitime katılmayan kişide de erişim açık
-- görünüyordu. Sonucu:
--
--   * panelde "Ön değerlendirmeyi doldur" adımı ve şeridi açılıyordu,
--   * ön değerlendirme hatırlatma görevi o kişiye de mail atıyordu,
--   * testlerim / on-degerlendirme sayfaları açılıyordu.
--
-- Hiçbiri danışmanlık müşterisi için anlamlı değil: ön değerlendirme birebir
-- EĞİTİMİN kapsamını kurmak için var, danışmanlık görüşmesinin böyle bir
-- adımı yok.
--
-- Ayrım course_id'ye değil GÖRÜŞME BAĞINA bakıyor: yönetici panelden elle
-- ödeme tanımlarken eğitim seçmeyebiliyor ve course_id boş kalabiliyor;
-- o kural bu tür bir eğitim ödemesini de kapatırdı. Danışmanlık ödemesi ise
-- her zaman bir gorusmeler satırından doğuyor ve payment_id ile ona bağlı.
create or replace function public.egitim_erisimim()
returns table(erisim boolean, kurumsal boolean, odeyen text)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return query select false, false, null::text;
    return;
  end if;

  -- Kendi ödemesi. Bireysel katılımcıların tamamı buradan çıkıyor.
  if exists (
    select 1
    from payments p
    where p.user_id = uid
      and p.durum = 'odendi'
      and not exists (select 1 from gorusmeler g where g.payment_id = p.id)
  ) then
    return query select true, false, null::text;
    return;
  end if;

  /*
    Kurumsal koltuk. Şirket adı varsa o daha anlamlı: katılımcı çoğu zaman
    ödemeyi yapan meslektaşını değil şirketi tanıyor.

    Danışmanlık kontrolü burada da var: koltuk her zaman eğitime ait ama
    kuralın tek yerde eksik kalması, ileride koltuk danışmanlığa bağlandığında
    aynı hatayı sessizce geri getirir.
  */
  return query
  select true, true,
         coalesce(
           nullif(trim(pr.sirket), ''),
           nullif(trim(concat_ws(' ', pr.ad, pr.soyad)), '')
         )
  from odeme_katilimcilari k
  join payments p on p.id = k.payment_id
  join profiles pr on pr.id = p.user_id
  where k.user_id = uid
    and p.durum = 'odendi'
    and not exists (select 1 from gorusmeler g where g.payment_id = p.id)
  limit 1;

  if not found then
    return query select false, false, null::text;
  end if;
end;
$function$;
