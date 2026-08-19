"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMarkaYollari, logoYuksekligiDuzelt } from "@/lib/marka";

export type MarkaAlan =
  | "logo_koyu_zemin"
  | "logo_acik_zemin"
  | "favicon"
  | "og_gorsel"
  | "eposta_logo";

// Branding shows on every page, so the whole site has to be refreshed.
function tazele() {
  revalidatePath("/", "layout");
  revalidatePath("/kontrol-9f4x2k/marka");
}

const IZINLI_ALANLAR: MarkaAlan[] = [
  "logo_koyu_zemin",
  "logo_acik_zemin",
  "favicon",
  "og_gorsel",
  "eposta_logo",
];

export async function markaGuncelle(
  alan: MarkaAlan,
  yeniYol: string | null,
  /** Paylaşım görselinde ölçüler; tarayıcıda okunup birlikte yazılıyor. */
  olcu?: { genislik: number; yukseklik: number } | null,
) {
  // Server action'lar herkese acik uc noktalardir; TypeScript tipi calisma
  // zamaninda yok, bu yuzden sutun adi burada dogrulanir.
  if (!IZINLI_ALANLAR.includes(alan)) return { error: "Geçersiz alan." };

  const supabase = await createClient();

  const oncekiler = await getMarkaYollari(supabase);
  const eskiYol =
    alan === "logo_koyu_zemin"
      ? oncekiler.logoKoyuZemin
      : alan === "logo_acik_zemin"
        ? oncekiler.logoAcikZemin
        : alan === "og_gorsel"
          ? oncekiler.ogGorsel
          : alan === "eposta_logo"
            ? oncekiler.epostaLogo
            : oncekiler.favicon;

  // Ölçüler yalnızca paylaşım görseline ait; görsel kaldırılınca da temizleniyor
  // ki eski boyut yeni görsele yapışmasın.
  const olculer =
    alan === "og_gorsel"
      ? { og_genislik: yeniYol ? (olcu?.genislik ?? null) : null, og_yukseklik: yeniYol ? (olcu?.yukseklik ?? null) : null }
      : {};

  const { data, error } = await supabase
    .from("marka")
    .update({ [alan]: yeniYol, ...olculer, updated_at: new Date().toISOString() })
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

/**
 * Logo yüksekliği.
 *
 * Ayrı bir eylem: dosya yükleme yok, yalnızca bir sayı. Değer sunucuda da
 * sınırlanıyor — server action'lar herkese açık uç noktalar ve buraya gelen
 * uç bir sayı bütün sayfaların başlığını bozardı. Veritabanındaki check
 * kısıtı üçüncü katman.
 */
export async function logoYuksekligiKaydet(deger: number) {
  const yukseklik = logoYuksekligiDuzelt(deger);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marka")
    .update({ logo_yuksekligi: yukseklik, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  tazele();
  return {};
}
