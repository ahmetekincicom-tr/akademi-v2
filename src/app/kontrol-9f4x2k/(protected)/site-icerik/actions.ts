"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function siteIcerikKaydet(input: {
  kayitDuyurusu: string;
  kayitDuyurusuAktif: boolean;
  duyuruStili: string;
  egitmenAd: string;
  egitmenUnvan: string;
  egitmenBiyografi: string;
}) {
  if (!input.egitmenAd.trim()) return { error: "Eğitmen adı boş olamaz." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_icerik")
    .update({
      kayit_duyurusu: input.kayitDuyurusu.trim() || null,
      kayit_duyurusu_aktif: input.kayitDuyurusuAktif,
      duyuru_stili: input.duyuruStili === "koyu" ? "koyu" : "acik",
      egitmen_ad: input.egitmenAd.trim(),
      egitmen_unvan: input.egitmenUnvan.trim() || null,
      egitmen_biyografi: input.egitmenBiyografi.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("id");

  if (error) return { error: error.message };
  // RLS engellediğinde hata değil sıfır satır döner.
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  // Duyuru ve eğitmen bilgisi bütün eğitim sayfalarında görünüyor.
  revalidatePath("/", "layout");
  return {};
}
