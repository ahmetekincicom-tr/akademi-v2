import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { guvenliUrl } from "@/lib/guvenli-url";

/**
 * Ön değerlendirme formunun adresi admin panelinden giriliyor (Entegrasyonlar →
 * Formlar) ve form_ayarlari view'ı üzerinden okunuyor. settings tablosu
 * öğrenciye kapalı; view bilerek yalnızca bu alanı yayınlıyor.
 */
export const getOnDegerlendirmeFormu = cache(async (): Promise<string | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("form_ayarlari")
    .select("on_degerlendirme")
    .maybeSingle();

  if (error || !data?.on_degerlendirme) return null;

  // Panele yapıştırılan değer iframe src'sine gidiyor; javascript: gibi
  // şemalar guvenliUrl'de eleniyor.
  return guvenliUrl(data.on_degerlendirme);
});

/**
 * Tally gizli alanları URL parametresiyle doldurulabiliyor. Katılımcının kim
 * olduğunu forma geçirince cevap Tally'ye kimliğiyle düşüyor; "adınız soyadınız"
 * sorup elle eşleştirmeye gerek kalmıyor.
 *
 * Tally tarafında bu adlarla gizli alan tanımlı olmalı: eposta, ad, kullanici.
 */
export function formUrlKimlikle(
  temel: string,
  kisi: { email: string | null; isim: string | null; id: string },
): string {
  try {
    const url = new URL(temel);
    if (kisi.email) url.searchParams.set("eposta", kisi.email);
    if (kisi.isim) url.searchParams.set("ad", kisi.isim);
    url.searchParams.set("kullanici", kisi.id);
    // Tally gömme görünümü: başlık ve kenar boşlukları iframe'de fazlalık.
    url.searchParams.set("transparentBackground", "1");
    return url.toString();
  } catch {
    return temel;
  }
}
