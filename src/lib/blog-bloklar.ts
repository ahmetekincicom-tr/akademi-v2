/**
 * Blog editör blokları — ortak tanımlar (bilgi, uyarı, ipucu, prompt).
 *
 * Çerçeveden bağımsız: hem Tiptap eklentileri (editör), hem "Blok Ekle" menüsü,
 * hem de slash tetikleyicileri buradan besleniyor. Etiket, menü adı ve komut tek
 * yerde durduğu için editör ile public render arasında tutarsızlık olmuyor.
 *
 * `tip`  → Tiptap node adı (JSON'da semantik ayrım burada).
 * `data` → HTML'de data-blok değeri (public renderer ve CSS bununla eşleşiyor).
 */

export type BlokTipi = "infoBlock" | "warningBlock" | "tipBlock" | "promptBlock" | "kaynakBlock";

export type BlokTanim = {
  tip: BlokTipi;
  /** HTML gövdesindeki data-blok değeri. */
  data: "info" | "warning" | "tip" | "prompt" | "kaynak";
  /** Blok içinde görünen varsayılan etiket. */
  etiket: string;
  /** "Blok Ekle" menüsündeki ad. */
  menu: string;
  /** Slash tetikleyici (`/bilgi` gibi); Türkçe karaktersiz. */
  komut: string;
};

export const BLOKLAR: BlokTanim[] = [
  { tip: "infoBlock", data: "info", etiket: "Bilgi", menu: "Bilgi", komut: "bilgi" },
  { tip: "warningBlock", data: "warning", etiket: "Dikkat", menu: "Uyarı", komut: "uyari" },
  { tip: "tipBlock", data: "tip", etiket: "Ahmet'in Notu", menu: "İpucu", komut: "ipucu" },
  { tip: "promptBlock", data: "prompt", etiket: "Örnek Prompt", menu: "Prompt", komut: "prompt" },
  // Kaynak: gövdesi yok, alanları (ad/url/not) node attribute'u — atom blok.
  { tip: "kaynakBlock", data: "kaynak", etiket: "Kaynak", menu: "Kaynak", komut: "kaynak" },
];
