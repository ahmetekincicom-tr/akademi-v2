"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Hesap silme talebi. Apple App Store 5.1.1(v) hesabın uygulama içinden
 * silinmeye başlatılabilmesini şart koşuyor.
 *
 * Tek adımda tamamlanmıyor, bilerek: hesap ödeme ve fatura kayıtlarına bağlı
 * ve bunların yasal saklama süresi var. Talep damgalanıyor, eğitmen kalan
 * veriyi temizleyip hesabı kapatıyor.
 */
export async function silmeTalebiOlustur() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({ silme_talebi_tarihi: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/panel/hesabim");
  return {};
}

/** Öğrenci fikrini değiştirirse talebi geri alabilmeli. */
export async function silmeTalebiGeriAl() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({ silme_talebi_tarihi: null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/panel/hesabim");
  return {};
}
