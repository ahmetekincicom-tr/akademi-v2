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
 * Panele "https://tally.so/r/xxxx" yapıştırılıyor ama /r/ formun kendi
 * sayfası: kendi başlığı, kendi kaydırması ve sabit yüksekliği var. Gömmek
 * için doğru olan /embed/ — sayfa süsü olmadan, dış yüksekliğe uyum sağlayan
 * sürüm. Bunu çevirmezsek iframe içinde ikinci bir kaydırma çubuğu çıkıyor.
 */
function gommeAdresi(url: URL): URL {
  if (url.hostname.endsWith("tally.so")) {
    url.pathname = url.pathname.replace(/^\/r\//, "/embed/");
  }
  return url;
}

/**
 * Tally gizli alanları URL parametresiyle doldurulabiliyor. Katılımcının kim
 * olduğunu forma geçirince cevap Tally'ye kimliğiyle düşüyor; "adınız soyadınız"
 * sorup elle eşleştirmeye gerek kalmıyor.
 *
 * ÖNEMLİ: parametre adları Tally formundaki gizli alan adlarıyla birebir aynı
 * olmalı. Tally tanımsız bir parametreyi sessizce yok sayar — form yine açılır
 * ama alanlar boş kalır. Beklenen adlar: eposta, ad, kullanici.
 */
export function formUrlKimlikle(
  temel: string,
  kisi: { email: string | null; isim: string | null; id: string },
): string {
  try {
    const url = gommeAdresi(new URL(temel));
    if (kisi.email) url.searchParams.set("eposta", kisi.email);
    if (kisi.isim) url.searchParams.set("ad", kisi.isim);
    url.searchParams.set("kullanici", kisi.id);

    // Gömme görünümü: form sayfasının kendi başlığı ve ortalaması iframe'de
    // fazlalık. dynamicHeight, embed.js ile birlikte iframe'i içeriğe göre
    // büyütüyor — içeride ayrı bir kaydırma kalmıyor.
    url.searchParams.set("transparentBackground", "1");
    url.searchParams.set("hideTitle", "1");
    url.searchParams.set("alignLeft", "1");
    url.searchParams.set("dynamicHeight", "1");
    return url.toString();
  } catch {
    return temel;
  }
}
