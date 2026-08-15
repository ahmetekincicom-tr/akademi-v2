-- Havale bildirimi.
--
-- Havale yolunu seçen öğrenci IBAN'ı görüp parayı gönderiyor, ama bunu bize
-- söylemesinin bir yolu yoktu: yönetici hesap ekstresini kontrol edene kadar
-- ödemeden habersiz kalıyor, öğrenci de "ulaştı mı" diye bekliyordu. Damga o
-- boşluğu kapatıyor; asıl doğrulama yine ekstreden yapılıyor.
alter table public.payments
  add column if not exists havale_bildirimi_tarihi timestamptz;

comment on column public.payments.havale_bildirimi_tarihi is
  'Öğrencinin "havaleyi yaptım" dediği an. Ödemenin gerçekleştiğinin kanıtı DEĞİL, yalnızca bir bildirim.';

create index if not exists payments_havale_bildirimi_idx
  on public.payments (havale_bildirimi_tarihi desc)
  where havale_bildirimi_tarihi is not null;

-- Öğrenciye UPDATE verilmiyor: payments üzerinde yazma yalnızca yöneticide ve
-- öyle kalmalı. Damgayı sunucu tarafındaki servis anahtarı yazıyor
-- (havaleBildir sunucu eylemi), kaydın sahipliği orada doğrulanıyor.
