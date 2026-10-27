import type { Element, ElementContent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";

/**
 * Yayın öncesi kontrol listesi.
 *
 * Kaynak: ahmetekinci.com.tr paneli (apps/panel/src/screens/blog/
 * publishChecks.ts). Orada build'i durduran kurallar kaydı engelliyordu;
 * akademide build kontrolü yok, bu yüzden hiçbiri ENGELLEMİYOR: yazı yayına
 * alınırken (Yayında / Zamanlı) eksikler bir pencerede listeleniyor, yazar
 * "yine de kaydet" diyebiliyor. Taslakta yan sütunda bilgi olarak duruyor.
 *
 * Gövdede H1 kontrolü yok: site temizleyicisi gövdedeki H1'i zaten H2'ye
 * çeviriyor (lib/blog-temizle).
 */

export type YayinKontrolGirdi = {
  baslik: string;
  ozet: string;
  seoAciklama: string;
  icerik: string;
  kategoriVar: boolean;
  kapakVar: boolean;
  kapakAlt: string;
  odakKelime: string;
  /** Odak kelimeyi kullanan diğer yazıların başlıkları. */
  ayniKelime: string[];
};

export type YayinKontrol = {
  id: "aciklama" | "kategori" | "gorsel-alt" | "kapak-alt" | "odak" | "odak-tekrar" | "icerik";
  tamam: boolean;
  /** Kontrolün adı (tamamken de görünür). */
  baslik: string;
  /** Eksikse ne yapılmalı. */
  oneri: string;
};

const elementMi = (n: Root | ElementContent): n is Element => n.type === "element";

/** Gövdedeki görseller: alt metni boş ve dekoratif işaretli olmayanlar eksik. */
export function altMetniEksikGorseller(html: string): number {
  if (!html.includes("<img")) return 0;
  let eksik = 0;
  const gez = (n: Root | ElementContent, dekoratif: boolean) => {
    if (!elementMi(n) && n.type !== "root") return;
    let alti = dekoratif;
    if (elementMi(n)) {
      // Editörde "dekoratif" seçilen görsel bilerek alt="" (tiptap/BlogGorsel).
      if (n.tagName === "figure" && String(n.properties.dataDecorative ?? "") === "1") alti = true;
      if (n.tagName === "img" && !alti && !String(n.properties.alt ?? "").trim()) eksik++;
    }
    for (const c of n.children) gez(c as ElementContent, alti);
  };
  gez(fromHtml(html, { fragment: true }), false);
  return eksik;
}

const metinVar = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0;

export function yayinKontrolleri(g: YayinKontrolGirdi): YayinKontrol[] {
  const eksikAlt = altMetniEksikGorseller(g.icerik);
  const k: YayinKontrol[] = [
    {
      id: "icerik",
      tamam: metinVar(g.icerik),
      baslik: "Yazının içeriği var",
      oneri: "İçerik boş; yayına almadan önce yazıyı yazın.",
    },
    {
      id: "aciklama",
      tamam: Boolean(g.seoAciklama.trim() || g.ozet.trim()),
      baslik: "Arama açıklaması (SEO açıklaması ya da özet)",
      oneri: "Google'da başlığın altında görünecek metin boş. Özet ya da SEO açıklaması yazın.",
    },
    {
      id: "kategori",
      tamam: g.kategoriVar,
      baslik: "Kategori seçildi",
      oneri: "Kategorisiz yazı kategori sayfalarında görünmez ve ilgili eğitim butonu genel kalır.",
    },
    {
      id: "gorsel-alt",
      tamam: eksikAlt === 0,
      baslik: eksikAlt ? `Görsellerde alt metin eksik (${eksikAlt})` : "Görsellerin alt metni var",
      oneri: "Editörde görsele tıklayıp “Alt metin” alanını doldurun; süs amaçlıysa “Dekoratif” işaretleyin.",
    },
    {
      id: "odak",
      tamam: Boolean(g.odakKelime.trim()),
      baslik: "Odak kelime girildi",
      oneri: "Yazının Google'da bulunmasını istediğiniz ifadeyi SEO kartındaki “Odak kelime” alanına yazın.",
    },
  ];
  if (g.kapakVar) {
    k.splice(4, 0, {
      id: "kapak-alt",
      tamam: Boolean(g.kapakAlt.trim()),
      baslik: "Kapak görselinin açıklaması",
      oneri: "Boş kalırsa yazı başlığı kullanılır; görselde ne olduğunu kısaca yazmak daha iyi.",
    });
  }
  if (g.odakKelime.trim() && g.ayniKelime.length) {
    k.push({
      id: "odak-tekrar",
      tamam: false,
      baslik: "Odak kelime başka yazıda da var",
      oneri: `Aynı kelime: ${g.ayniKelime.map((b) => `“${b}”`).join(", ")}. Aynı aramada iki yazı birbiriyle yarışır; farklı bir ifade seçin.`,
    });
  }
  return k;
}

export const eksikKontroller = (k: YayinKontrol[]) => k.filter((x) => !x.tamam);
