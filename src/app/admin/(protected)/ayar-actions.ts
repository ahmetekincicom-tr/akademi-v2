"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function ayarKaydet(anahtar: string, deger: Record<string, string>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ anahtar, deger, updated_at: new Date().toISOString() }, { onConflict: "anahtar" });

  if (error) return { error: error.message };
  revalidatePath("/admin/ayarlar");
  revalidatePath("/admin/entegrasyonlar");
  return {};
}
