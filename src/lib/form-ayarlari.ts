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
 * ama alanlar boş kalır. Beklenen adlar: eposta, ad, soyad, telefon, kullanici.
 *
 * Ad ve soyad AYRI gidiyor, birleştirilmiş tek bir alan olarak değil: Tally
 * yanıtlarını dışa aktarırken ya da bir listeye eklerken ikisini ayırmak
 * gerekiyor ve "Ayşe Yılmaz Kara" gibi bir değeri sonradan bölmenin güvenilir
 * bir yolu yok.
 *
 * `kullanici` diğerlerinden farklı: o yalnızca kolaylık değil, webhook'un
 * cevabı kime yazacağını bilmesinin TEK yolu. Gizli alan yoksa form çalışır
 * ama hiçbir adım işaretlenmez.
 */
export function formUrlKimlikle(
  temel: string,
  kisi: {
    email: string | null;
    ad?: string | null;
    soyad?: string | null;
    telefon?: string | null;
    id: string;
  },
): string {
  try {
    const url = gommeAdresi(new URL(temel));
    if (kisi.email) url.searchParams.set("eposta", kisi.email);
    if (kisi.ad?.trim()) url.searchParams.set("ad", kisi.ad.trim());
    if (kisi.soyad?.trim()) url.searchParams.set("soyad", kisi.soyad.trim());
    /*
      Telefon panelde kayıtlı olan; forma yeniden sordurmuyoruz. Kayıtlı
      değilse parametre hiç eklenmiyor — boş bir değer göndermek, Tally
      cevabında "telefon: (boş)" gibi görünüp numarası olmadığı mı yoksa
      alanın çalışmadığı mı belirsiz kalırdı.
    */
    if (kisi.telefon?.trim()) url.searchParams.set("telefon", kisi.telefon.trim());
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
