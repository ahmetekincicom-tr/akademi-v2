"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function gorusmeTalepEt(input: { konu: string; aciklama: string; tercihZaman: string }) {
  const supabase = await createClient();

  // Ücretsiz hak sayımı ve fiyat veritabanı fonksiyonunda belirlenir; buradan
  // gönderilen hiçbir değer ücreti etkilemez.
  const { error } = await supabase.rpc("gorusme_talep_olustur", {
    p_konu: input.konu,
    p_aciklama: input.aciklama,
    p_tercih_zaman: input.tercihZaman,
  });

  if (error) return { error: error.message };

  revalidatePath("/panel/gorusmeler");
  revalidatePath("/admin/gorusmeler");
  return {};
}

export async function gorusmeIptalEt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("gorusme_iptal", { p_id: id });
  if (error) return { error: error.message };

  revalidatePath("/panel/gorusmeler");
  revalidatePath("/admin/gorusmeler");
  return {};
}
