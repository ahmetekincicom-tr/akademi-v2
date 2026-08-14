"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OdemeInput = {
  userId: string;
  courseId: string;
  tutar: string;
  yontem: string;
  durum: "odendi" | "bekliyor" | "iade";
  odemeTarihi: string;
  faturaNo: string;
  /** Öğrenci bu kaydı panelden kartla ödeyebilsin mi? */
  onlineOdeme: boolean;
};

export async function odemeEkle(input: OdemeInput) {
  const tutar = Number(input.tutar.replace(",", "."));
  if (!input.userId) return { error: "Öğrenci seçmelisin." };
  if (!Number.isFinite(tutar) || tutar <= 0) return { error: "Geçerli bir tutar gir." };

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    user_id: input.userId,
    course_id: input.courseId || null,
    tutar,
    yontem: input.yontem.trim() || null,
    durum: input.durum,
    odeme_tarihi: input.odemeTarihi ? new Date(input.odemeTarihi).toISOString() : new Date().toISOString(),
    fatura_no: input.faturaNo.trim() || null,
    online_odeme: input.onlineOdeme,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/odemeler");
  revalidatePath("/admin");
  return {};
}

/**
 * Kartla ödemeyi kayıt bazında açıp kapatır.
 *
 * Havaleyle anlaşılmış bir kayıt için gereklidir: öğrenci aynı borcu bir de
 * karttan ödeyip iki kez tahsilat oluşturmasın.
 */
export async function odemeOnlineDegistir(id: string, acik: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ online_odeme: acik }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/odemeler");
  return {};
}

export async function odemeDurumDegistir(id: string, durum: "odendi" | "bekliyor" | "iade") {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").update({ durum }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/odemeler");
  revalidatePath("/admin");
  return {};
}

export async function odemeSil(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/odemeler");
  revalidatePath("/admin");
  return {};
}
