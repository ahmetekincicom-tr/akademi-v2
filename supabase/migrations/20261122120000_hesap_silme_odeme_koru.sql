-- Hesap silindiğinde ödeme kayıtları korunur, kişiden ayrılır.
--
-- payments.user_id profiles'a "on delete cascade" ile bağlıydı: bir hesap
-- silinince o kişinin ödeme kayıtları da siliniyordu. Ödeme ve fatura
-- kayıtlarının yasal saklama süresi var (hesap silme ekranı da bunu
-- söylüyor: "bu kayıtlar kimliğinden ayrıştırılır"). Artık hesap silinince
-- ödeme satırı kalıyor, user_id boşalıyor; tutar, tarih, fatura no ve eğitim
-- duruyor.
--
-- Kısıt adı elle verilmedi; ilk şemada varsayılan adla oluştu. Adı
-- tahmin etmek yerine katalogdan bulunuyor.

alter table public.payments alter column user_id drop not null;

do $$
declare
  kisit text;
begin
  select con.conname into kisit
  from pg_constraint con
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
  where con.conrelid = 'public.payments'::regclass
    and con.contype = 'f'
    and att.attname = 'user_id';

  if kisit is not null then
    execute format('alter table public.payments drop constraint %I', kisit);
  end if;
end $$;

alter table public.payments
  add constraint payments_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;
