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

/**
 * Giriş yapan kişi yönetici mi?
 *
 * Server action'lar herkese açık uç noktalar: bir düğmenin yalnızca yönetici
 * arayüzünde çizilmesi, o eylemin yalnızca yönetici tarafından
 * çağrılabileceği anlamına gelmiyor. Yalnızca yöneticiye ait bir işlem
 * yapan her eylem bunu sunucuda da sormalı.
 */
export async function yoneticiMi(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}
