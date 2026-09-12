"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function ayarKaydet(anahtar: string, deger: Record<string, string>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ anahtar, deger, updated_at: new Date().toISOString() }, { onConflict: "anahtar" });

  if (error) return { error: error.message };
  revalidatePath("/kontrol-9f4x2k/ayarlar");
  revalidatePath("/kontrol-9f4x2k/entegrasyonlar");
  /*
    Ölçümleme (GA4/GTM/Ads), banka ve form ayarları ön yüze basılıyor; bu
    değerler kök layout'taki Olcumleme bileşeninden ve ödeme/iletişim
    sayfalarından okunuyor. Ön yüz sayfaları 1 saatlik ISR önbelleğiyle
    çalıştığı için, layout tazelenmezse panelde değiştirilen etiket kimliği
    canlıya bir saate kadar yansımıyordu — kaydettikten sonra "hiçbir şey
    değişmedi" görünmesinin sebebi buydu. Diğer panel işlemleri (marka,
    site-icerik) zaten böyle yapıyor.
  */
  revalidatePath("/", "layout");
  return {};
}
