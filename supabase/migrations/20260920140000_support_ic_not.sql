-- Destek mesajlarında iç not (internal note) ayrımı.
--
-- Yönetici bir talebe hem KATILIMCIYA giden yanıt hem de yalnızca ekibin
-- gördüğü iç not yazabilsin diye. İç notlar öğrenci panelinde GÖSTERİLMİYOR
-- (lib/destek.ts kapsam="kendi" bunları eliyor) ve talebin durumunu/bildirimini
-- değiştirmiyor.
--
-- Geriye dönük güvenli: varsayılan false → mevcut tüm mesajlar normal yanıt.

alter table public.support_messages add column if not exists ic_not boolean not null default false;

comment on column public.support_messages.ic_not is
  'true → yalnızca ekibin gördüğü iç not; öğrenci panelinde gösterilmez, durum/bildirim değiştirmez.';
