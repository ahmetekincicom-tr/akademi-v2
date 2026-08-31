"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { veriHatasi } from "@/lib/auth-hatalari";
import { KURUMSAL_AYAR_ANAHTARI } from "@/lib/kurumsal";

/**
 * Kurumsal sayfasının SSS listesini kaydeder.
 *
 * Soru ya da cevabı boş satırlar kaydedilmiyor: "soru ekle"ye basıp
 * doldurmadan kaydeden birinin sayfada boş bir akordiyon başlığı görmesini
 * engelliyor.
 */
export async function kurumsalSssKaydet(sss: { soru: string; cevap: string }[]) {
  const temiz = sss
    .map((s) => ({ soru: s.soru.trim(), cevap: s.cevap.trim() }))
    .filter((s) => s.soru && s.cevap);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .upsert(
      { anahtar: KURUMSAL_AYAR_ANAHTARI, deger: { sss: temiz }, updated_at: new Date().toISOString() },
      { onConflict: "anahtar" },
    )
    .select("anahtar");

  if (error) return { error: veriHatasi(error) };
  // RLS engellediğinde hata değil sıfır satır döner.
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  revalidatePath("/kurumsal");
  revalidatePath("/kontrol-9f4x2k/kurumsal");
  return {};
}
