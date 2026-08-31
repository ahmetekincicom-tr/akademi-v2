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
  rozetMetni: string;
  rozetAktif: boolean;
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
      rozet_metni: input.rozetMetni.trim() || null,
      // Metin boşsa rozet açık kalamaz: boş bir rozet, ekranda anlamsız bir
      // çerçeve demek.
      rozet_aktif: input.rozetAktif && Boolean(input.rozetMetni.trim()),
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

/**
 * Eğitmen portresini bağlar ya da kaldırır.
 *
 * Dosya istemciden doğrudan `kapaklar` kovasına yükleniyor (kapak görselinde
 * olduğu gibi); burada yalnızca yol kaydediliyor. Eski dosya siliniyor, yoksa
 * her değişiklikte kovada bir kopya birikir.
 */
export async function egitmenGorseliGuncelle(yol: string | null): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: mevcut } = await supabase.from("site_icerik").select("egitmen_gorsel").eq("id", true).maybeSingle();

  const { data, error } = await supabase
    .from("site_icerik")
    .update({ egitmen_gorsel: yol, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  const eski = mevcut?.egitmen_gorsel;
  if (eski && eski !== yol) {
    await supabase.storage.from("kapaklar").remove([eski]);
  }

  revalidatePath("/", "layout");
  return {};
}
