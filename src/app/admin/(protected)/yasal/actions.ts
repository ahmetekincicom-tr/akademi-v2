"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type YasalInput = {
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  guncelleme: string;
  yayinda: boolean;
};

export async function yasalKaydet(input: YasalInput): Promise<{ error?: string }> {
  if (!input.baslik.trim()) return { error: "Başlık zorunlu." };
  if (input.yayinda && !input.icerik.trim()) {
    return { error: "Boş bir metni yayınlayamazsın. Önce içeriği yapıştır." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("yasal_sayfalar")
    .update({
      baslik: input.baslik.trim(),
      ozet: input.ozet.trim() || null,
      icerik: input.icerik,
      guncelleme: input.guncelleme || null,
      yayinda: input.yayinda,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", input.slug)
    .select("slug");

  if (error) return { error: error.message };
  // RLS engellediğinde hata değil, sıfır satır döner.
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  revalidatePath(`/${input.slug}`);
  revalidatePath("/admin/yasal");
  return {};
}
