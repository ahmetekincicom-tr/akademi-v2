import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Panel sorgularının kapsamı.
 *
 * RLS politikalarının çoğu "kendi satırın VEYA yöneticiysen hepsi" biçiminde
 * ve bu, yönetim ekranları için doğru. Ama YÖNETİCİ AYNI ZAMANDA BİR
 * KATILIMCI: kendi öğrenci paneline girdiğinde aynı sorgular çalışıyor ve
 * RLS ona herkesin satırını döndürüyor. Sonuç, panelin başkalarının ders
 * kaydı klasörlerini, ödemelerini, destek taleplerini ve giriş geçmişini
 * kendi ekranında göstermesi.
 *
 * Bu bir RLS açığı değil — normal bir katılımcı yalnızca kendi satırını
 * görüyor, kimse başkasının verisine erişmiyor. Ama panel "benim
 * ekranım" demek ve orada başka kimsenin verisi olmamalı.
 *
 * Çözüm politikayı daraltmak değil (yönetim ekranlarının o genişliğe ihtiyacı
 * var), panel tarafındaki her sorguya AÇIK bir user_id süzgeci koymak.
 * Süzgeç RLS'e ek bir katman: RLS erişimi, bu fonksiyon kapsamı belirliyor.
 */
export async function panelKullanicisi(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
