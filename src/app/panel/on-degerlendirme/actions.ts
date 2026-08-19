"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { veriHatasi } from "@/lib/auth-hatalari";

/**
 * Formun doldurulduğunu işaretler. Cevaplar Tally'de kalıyor; burada tutulan
 * tek şey zaman damgası.
 *
 * Güvenilirliği webhook kadar değil — öğrenci bu işlemi formu doldurmadan da
 * tetikleyebilir. Kaybedilecek bir şey yok: en fazla karşılama ekranındaki
 * adımı erkenden kapatmış olur, cevaplar zaten Tally tarafında görünür.
 */
export async function onDegerlendirmeIsaretle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("profiles")
    .update({ on_degerlendirme_tarihi: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: veriHatasi(error) };

  revalidatePath("/panel");
  revalidatePath("/panel/on-degerlendirme");
  return {};
}
