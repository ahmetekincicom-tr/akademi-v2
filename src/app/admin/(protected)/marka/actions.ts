"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMarkaYollari } from "@/lib/marka";

export type MarkaAlan = "logo_koyu_zemin" | "logo_acik_zemin" | "favicon";

// Branding shows on every page, so the whole site has to be refreshed.
function tazele() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/marka");
}

export async function markaGuncelle(alan: MarkaAlan, yeniYol: string | null) {
  const supabase = await createClient();

  const oncekiler = await getMarkaYollari(supabase);
  const eskiYol =
    alan === "logo_koyu_zemin"
      ? oncekiler.logoKoyuZemin
      : alan === "logo_acik_zemin"
        ? oncekiler.logoAcikZemin
        : oncekiler.favicon;

  const { data, error } = await supabase
    .from("marka")
    .update({ [alan]: yeniYol, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");

  if (error) return { error: error.message };
  // RLS engellediğinde hata değil, sıfır satır döner.
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  // Row updated first: an orphaned file is harmless, a row pointing at a
  // deleted file is a broken logo on every page.
  if (eskiYol && eskiYol !== yeniYol) {
    await supabase.storage.from("marka").remove([eskiYol]);
  }

  tazele();
  return {};
}
