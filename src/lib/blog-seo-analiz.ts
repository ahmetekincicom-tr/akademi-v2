import type { Element, ElementContent, Root, RootContent } from "hast";
import { fromHtml } from "hast-util-from-html";

/**
 * Yazı SEO ve okunabilirlik analizi (Yoast benzeri, Türkçe).
 *
 * Kaynak: ahmetekinci.com.tr (apps/panel/src/screens/blog/seo/seoAnalysis.ts);
 * kurallar ve eşikler aynı. Farklar: HTML DOMParser yerine hast ile
 * çözümleniyor (hem editörde hem testte çalışsın diye) ve marka eki
 * akademinin başlık kuralı (lib/seo.ts → baslikMetasi).
 *
 * Türkçe eşleştirme:
 *  - Büyük/küçük harf ve Türkçe harfler katlanıyor: "İSTANBUL", "istanbul",
 *    "Istanbul" aynı; ç/ğ/ı/ö/ş/ü ASCII karşılıklarıyla da eşleşiyor.
 *  - Ek toleransı: anahtar kelimenin her sözcüğü metindeki sözcüğün başı
 *    olabilir ("sosyal medya" → "sosyal medyanın"); son harf yumuşaması
 *    (p→b, t→d, k→g) da kabul ("kitap" → "kitabı"). 3 harften kısa
 *    sözcüklerde yalnız tam eşleşme.
 */

export type Durum = "iyi" | "orta" | "kotu";
export type Grup = "seo" | "okunabilirlik";
export type SeoKontrol = { id: string; grup: Grup; durum: Durum; mesaj: string };

export type SeoGirdi = {
  odakKelime: string;
  /** Yazı başlığı (sayfadaki H1). */
  baslik: string;
  /** Panelde girilen SEO başlığı (boşsa yazı başlığı). */
  seoBaslik: string;
  seoAciklama: string;
  ozet: string;
  slug: string;
  /** Gövde HTML'i. */
  icerik: string;
  kapakVar?: boolean;
  kapakAlt?: string;
  /** Odak kelimeyi kullanan diğer yazılar. */
  ayniKelime?: { baslik: string; slug: string }[];
};

export type SeoSonuc = {
  kontroller: SeoKontrol[];
  puan: { seo: number; okunabilirlik: number };
  durum: { seo: Durum; okunabilirlik: Durum };
  istatistik: {
    kelime: number;
    odakSayisi: number;
    /** Yüzde. */
    yogunluk: number;
    baslikPiksel: number;
    baslikKarakter: number;
    aciklamaKarakter: number;
    icBaglanti: number;
    disBaglanti: number;
    gorsel: number;
  };
};

/* --------------------------------------------------------- sınırlar --- */
export const BASLIK_EN_FAZLA_PIKSEL = 580;
export const BASLIK_KARAKTER = { min: 30, max: 60 } as const;
export const ACIKLAMA_KARAKTER = { min: 120, max: 160 } as const;
export const ICERIK_KELIME = { onerilen: 600, enAz: 300 } as const;
export const YOGUNLUK = { min: 0.5, max: 3, asiri: 4 } as const;
export const CUMLE_KELIME = { iyi: 20, orta: 25 } as const;
export const PARAGRAF_KELIME = 150;

/** lib/seo.ts → SITE_ADI ve baslikMetasi ile aynı kural (test bunu doğruluyor). */
export const MARKA_EKI = " — Ahmet Ekinci Akademi";
const SITE_ALANLARI = ["ahmetekinciakademi.com", "www.ahmetekinciakademi.com", "panel.ahmetekinciakademi.com"];

/* ----------------------------------------------------- metin araçları --- */
const TR_ASCII: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** Türkçe büyük/küçük harf katlama + ASCII'ye indirme: "İSTANBUL'DA Işık" → "istanbul'da isik". */
export function turkceKatla(metin: string): string {
  return metin
    .normalize("NFC")
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (h) => TR_ASCII[h] ?? h)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Katlanmış sözcükler. Özel addan kesmeyle ayrılan ek atılır: "İstanbul'da" → istanbul. */
export function sozcuklereAyir(metin: string): string[] {
  return turkceKatla(metin)
    .replace(/([a-z0-9])['’ʼ][a-z]+/g, "$1")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const YUMUSAMA: Record<string, string[]> = { p: ["b"], t: ["d"], k: ["g"] };

/** Metindeki sözcük, anahtar sözcüğün (ekli) biçimi mi? */
export function sozcukEslesir(anahtar: string, sozcuk: string): boolean {
  if (sozcuk === anahtar) return true;
  if (anahtar.length < 3) return false;
  const enFazlaEk = 7;
  if (sozcuk.startsWith(anahtar) && sozcuk.length - anahtar.length <= enFazlaEk) return true;
  const son = anahtar.at(-1)!;
  const kok = anahtar.slice(0, -1);
  for (const yumusak of YUMUSAMA[son] ?? []) {
    if (sozcuk.startsWith(kok + yumusak) && sozcuk.length - anahtar.length <= enFazlaEk && sozcuk.length > anahtar.length) {
      return true;
    }
  }
  return false;
}

/** Anahtar kelimenin (çok sözcüklü olabilir) sözcük dizisinde kaç kez geçtiği. */
export function kelimeSay(sozcukler: string[], anahtar: string): number {
  const parcalar = sozcuklereAyir(anahtar);
  if (!parcalar.length) return 0;
  let sayi = 0;
  for (let i = 0; i + parcalar.length <= sozcukler.length; i++) {
    if (parcalar.every((p, k) => sozcukEslesir(p, sozcukler[i + k]!))) {
      sayi++;
      i += parcalar.length - 1;
    }
  }
  return sayi;
}

export const kelimeGecer = (metin: string, anahtar: string) => kelimeSay(sozcuklereAyir(metin), anahtar) > 0;

export function kelimeyleBaslar(metin: string, anahtar: string): boolean {
  const s = sozcuklereAyir(metin);
  const p = sozcuklereAyir(anahtar);
  return p.length > 0 && p.every((parca, i) => s[i] !== undefined && sozcukEslesir(parca, s[i]!));
}

/* ------------------------------------------- Google başlık genişliği --- */
// Arial genişlikleri (1000 birim/em); Google masaüstü başlığı ~20 px Arial.
const ARIAL: Record<string, number> = {
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833,
  n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833,
  N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  " ": 278, ".": 278, ",": 278, ":": 278, ";": 278, "!": 278, "?": 556, "'": 191, "’": 222, '"': 355, "-": 333,
  "–": 556, "—": 1000, "|": 260, "(": 333, ")": 333, "[": 278, "]": 278, "&": 667, "/": 278, "%": 889, "+": 584,
};
const TR_TABAN: Record<string, string> = {
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I", ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U", â: "a", î: "i", û: "u",
};

/** Başlığın Google masaüstü sonucundaki yaklaşık genişliği (px). */
export function baslikPikseli(baslik: string, punto = 20): number {
  let birim = 0;
  for (const ham of baslik.normalize("NFC")) birim += ARIAL[TR_TABAN[ham] ?? ham] ?? 556;
  return Math.round((birim * punto) / 1000);
}

/** Metni piksel sınırına sığacak şekilde "…" ile keser (Google önizlemesi). */
export function piksleSigdir(metin: string, enFazla: number, punto = 20): string {
  if (baslikPikseli(metin, punto) <= enFazla) return metin;
  const uc = baslikPikseli("…", punto) || 20;
  let cikti = "";
  for (const h of metin) {
    if (baslikPikseli(cikti + h, punto) + uc > enFazla) break;
    cikti += h;
  }
  return `${cikti.replace(/\s+\S*$/, "") || cikti}…`;
}

/** Arama sonucunda görünen başlık: marka eki 60 karakteri aşmıyorsa ekleniyor. */
export function gorunenBaslik(seoBaslik: string, baslik: string): string {
  const taban = seoBaslik.trim() || baslik.trim();
  return `${taban}${MARKA_EKI}`.length <= BASLIK_KARAKTER.max ? `${taban}${MARKA_EKI}` : taban;
}

/* -------------------------------------------------- içerik çözümleme --- */
type Cozum = {
  metin: string;
  paragraflar: string[];
  ilkParagraf: string;
  altBasliklar: string[];
  h1Sayisi: number;
  gorseller: { alt: string }[];
  baglantilar: string[];
};

const BLOK = new Set(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "br", "div", "blockquote", "figcaption", "summary", "pre"]);
const elementMi = (n: RootContent | ElementContent | Root): n is Element => n.type === "element";

function duzMetin(n: Root | RootContent | ElementContent): string {
  if (n.type === "text") return n.value;
  if (!("children" in n)) return "";
  const ic = n.children.map((c) => duzMetin(c as ElementContent)).join("");
  return elementMi(n) && BLOK.has(n.tagName) ? `${ic} ` : ic;
}

function icerigiCoz(html: string): Cozum {
  const agac = fromHtml(html || "", { fragment: true });
  const paragraflar: string[] = [];
  const altBasliklar: string[] = [];
  const gorseller: { alt: string }[] = [];
  const baglantilar: string[] = [];
  let h1Sayisi = 0;
  const temiz = (s: string) => s.replace(/\s+/g, " ").trim();

  const gez = (n: Root | ElementContent) => {
    if (!elementMi(n) && n.type !== "root") return;
    if (elementMi(n)) {
      if (n.tagName === "p") {
        const t = temiz(duzMetin(n));
        if (t) paragraflar.push(t);
      } else if (n.tagName === "h2" || n.tagName === "h3") altBasliklar.push(temiz(duzMetin(n)));
      else if (n.tagName === "h1") h1Sayisi++;
      else if (n.tagName === "img") gorseller.push({ alt: String(n.properties.alt ?? "").trim() });
      else if (n.tagName === "a" && typeof n.properties.href === "string") baglantilar.push(n.properties.href);
    }
    for (const c of n.children) gez(c as ElementContent);
  };
  gez(agac);

  return {
    metin: temiz(duzMetin(agac)),
    paragraflar,
    ilkParagraf: paragraflar[0] ?? "",
    altBasliklar,
    h1Sayisi,
    gorseller,
    baglantilar,
  };
}

/** Bağlantı site içi mi? Kök göreli yol ya da akademinin alan adı. */
export function icBaglantiMi(href: string): boolean {
  const d = href.trim();
  if (!d || d.startsWith("#") || /^(mailto|tel):/i.test(d)) return false;
  if (d.startsWith("/") && !d.startsWith("//")) return true;
  try {
    return SITE_ALANLARI.includes(new URL(d, "https://ahmetekinciakademi.com/").hostname);
  } catch {
    return false;
  }
}

const disBaglantiMi = (href: string) => /^https?:\/\//i.test(href.trim()) && !icBaglantiMi(href);

/** Cümleler: . ! ? … ile biter (sayılardaki noktalar kabaca ayıklanır). */
export function cumlelereAyir(metin: string): string[] {
  return metin
    .replace(/(\d)\.(\d)/g, "$1,$2")
    .split(/(?<=[.!?…])\s+(?=[A-ZÇĞİÖŞÜ0-9"“'(])/u)
    .map((c) => c.trim())
    .filter((c) => sozcuklereAyir(c).length > 0);
}

const yuzde = (d: number) => Math.round(d * 10) / 10;

/** 0–100: iyi = 1, orta = 0,5, kötü = 0 puan ortalaması. */
export function puanla(kontroller: Pick<SeoKontrol, "durum">[]): number {
  if (!kontroller.length) return 0;
  const p = kontroller.reduce((t, k) => t + (k.durum === "iyi" ? 1 : k.durum === "orta" ? 0.5 : 0), 0);
  return Math.round((p / kontroller.length) * 100);
}

export const puanDurumu = (puan: number): Durum => (puan >= 75 ? "iyi" : puan >= 50 ? "orta" : "kotu");

/* ------------------------------------------------------------ analiz --- */
export function seoAnalizEt(g: SeoGirdi): SeoSonuc {
  const c = icerigiCoz(g.icerik);
  const sozcukler = sozcuklereAyir(c.metin);
  const kelime = sozcukler.length;
  const odak = g.odakKelime.replace(/\s+/g, " ").trim();
  const odakVar = sozcuklereAyir(odak).length > 0;
  const aciklama = (g.seoAciklama.trim() || g.ozet.trim()).replace(/\s+/g, " ");
  const gorunen = gorunenBaslik(g.seoBaslik, g.baslik);
  const piksel = baslikPikseli(gorunen);
  const odakSayisi = odakVar ? kelimeSay(sozcukler, odak) : 0;
  const yogunluk = kelime && odakVar ? yuzde(((odakSayisi * sozcuklereAyir(odak).length) / kelime) * 100) : 0;
  const icB = c.baglantilar.filter(icBaglantiMi).length;
  const disB = c.baglantilar.filter(disBaglantiMi).length;
  const gorseller = [...c.gorseller, ...(g.kapakVar ? [{ alt: (g.kapakAlt ?? "").trim() }] : [])];

  const k: SeoKontrol[] = [];
  const ekle = (id: string, grup: Grup, durum: Durum, mesaj: string) => k.push({ id, grup, durum, mesaj });

  if (!odakVar) {
    ekle("odak", "seo", "kotu", "Odak kelime girilmedi; kelimeye bağlı kontroller yapılamıyor.");
  } else {
    const n = sozcuklereAyir(odak).length;
    if (n > 4) ekle("odak-uzunluk", "seo", "orta", `Odak kelime ${n} sözcük; 1–4 sözcüklük bir ifade daha kolay sıralanır.`);
    if (g.ayniKelime?.length) {
      ekle(
        "odak-tekrar",
        "seo",
        "kotu",
        `Bu odak kelime başka yazıda da var: ${g.ayniKelime.map((y) => `“${y.baslik}”`).join(", ")}. Aynı kelimede yazılar birbiriyle yarışır.`,
      );
    } else ekle("odak-tekrar", "seo", "iyi", "Odak kelime başka bir yazıda kullanılmıyor.");

    ekle(
      "odak-baslik",
      "seo",
      kelimeGecer(g.baslik, odak) ? "iyi" : "kotu",
      kelimeGecer(g.baslik, odak) ? "Odak kelime yazı başlığında geçiyor." : "Odak kelime yazı başlığında geçmiyor.",
    );

    const seoB = g.seoBaslik.trim() || g.baslik;
    if (kelimeyleBaslar(seoB, odak)) ekle("odak-seo-baslik", "seo", "iyi", "SEO başlığı odak kelimeyle başlıyor.");
    else if (kelimeGecer(seoB, odak)) ekle("odak-seo-baslik", "seo", "orta", "Odak kelime SEO başlığında var ama başta değil; başa almak tıklanmayı artırır.");
    else ekle("odak-seo-baslik", "seo", "kotu", "Odak kelime SEO başlığında geçmiyor.");

    const slugta = kelimeSay(g.slug.split("-").filter(Boolean), odak) > 0;
    ekle("odak-adres", "seo", slugta ? "iyi" : "kotu", slugta ? "Adres odak kelimeyi içeriyor." : "Adres odak kelimeyi içermiyor.");

    if (!c.ilkParagraf) ekle("odak-giris", "seo", "kotu", "Gövdede paragraf yok; odak kelime ilk paragrafta geçmeli.");
    else if (kelimeGecer(c.ilkParagraf, odak)) ekle("odak-giris", "seo", "iyi", "Odak kelime ilk paragrafta geçiyor.");
    else ekle("odak-giris", "seo", "kotu", "Odak kelime ilk paragrafta geçmiyor; girişte konuyu net söyleyin.");

    if (!c.altBasliklar.length) {
      ekle("odak-altbaslik", "seo", kelime >= ICERIK_KELIME.enAz ? "kotu" : "orta", "Alt başlık (H2/H3) yok; metni başlıklarla bölümlere ayırın.");
    } else {
      const isabet = c.altBasliklar.filter((h) => kelimeGecer(h, odak)).length;
      ekle(
        "odak-altbaslik",
        "seo",
        isabet ? "iyi" : "orta",
        isabet ? `Odak kelime ${c.altBasliklar.length} alt başlığın ${isabet} tanesinde geçiyor.` : "Odak kelime hiçbir alt başlıkta (H2/H3) geçmiyor.",
      );
    }

    if (!gorseller.length) ekle("odak-gorsel", "seo", "orta", "Görsel yok; odak kelimeyi alt metninde kullanabileceğiniz bir görsel ekleyin.");
    else if (gorseller.some((x) => kelimeGecer(x.alt, odak))) ekle("odak-gorsel", "seo", "iyi", "Odak kelime en az bir görselin alt metninde geçiyor.");
    else ekle("odak-gorsel", "seo", "orta", "Odak kelime hiçbir görselin alt metninde geçmiyor.");

    if (!aciklama) ekle("odak-aciklama", "seo", "kotu", "Açıklama boş; odak kelimeyi içeren bir açıklama yazın.");
    else if (kelimeGecer(aciklama, odak)) ekle("odak-aciklama", "seo", "iyi", "Odak kelime açıklamada geçiyor.");
    else ekle("odak-aciklama", "seo", "kotu", "Odak kelime açıklamada geçmiyor.");

    if (!kelime) ekle("odak-yogunluk", "seo", "kotu", "Gövde boş; kelime yoğunluğu hesaplanamıyor.");
    else if (odakSayisi === 0) ekle("odak-yogunluk", "seo", "kotu", "Odak kelime metinde hiç geçmiyor.");
    else if (yogunluk > YOGUNLUK.asiri) ekle("odak-yogunluk", "seo", "kotu", `Kelime yoğunluğu %${yogunluk} (${odakSayisi} kez); aşırı tekrar, doğal yazın.`);
    else if (yogunluk > YOGUNLUK.max) ekle("odak-yogunluk", "seo", "orta", `Kelime yoğunluğu %${yogunluk} (${odakSayisi} kez); biraz fazla.`);
    else if (yogunluk < YOGUNLUK.min) ekle("odak-yogunluk", "seo", "orta", `Kelime yoğunluğu %${yogunluk} (${odakSayisi} kez); önerilen %${YOGUNLUK.min}–${YOGUNLUK.max}.`);
    else ekle("odak-yogunluk", "seo", "iyi", `Kelime yoğunluğu %${yogunluk} (${odakSayisi} kez); iyi.`);
  }

  if (piksel > BASLIK_EN_FAZLA_PIKSEL) {
    ekle("baslik-uzunluk", "seo", "kotu", `Başlık Google'da kesilir: ~${piksel} px (en fazla ${BASLIK_EN_FAZLA_PIKSEL} px), ${gorunen.length} karakter.`);
  } else if (gorunen.length < BASLIK_KARAKTER.min) {
    ekle("baslik-uzunluk", "seo", "orta", `Başlık kısa: ${gorunen.length} karakter (önerilen ${BASLIK_KARAKTER.min}–${BASLIK_KARAKTER.max}).`);
  } else ekle("baslik-uzunluk", "seo", "iyi", `Başlık uzunluğu iyi: ~${piksel} px, ${gorunen.length} karakter.`);

  if (!aciklama) ekle("aciklama-uzunluk", "seo", "kotu", "Açıklama yok (SEO açıklaması da özet de boş).");
  else if (aciklama.length < ACIKLAMA_KARAKTER.min) ekle("aciklama-uzunluk", "seo", "orta", `Açıklama kısa: ${aciklama.length} karakter (önerilen ${ACIKLAMA_KARAKTER.min}–${ACIKLAMA_KARAKTER.max}).`);
  else if (aciklama.length > ACIKLAMA_KARAKTER.max) ekle("aciklama-uzunluk", "seo", "orta", `Açıklama uzun: ${aciklama.length} karakter; Google ${ACIKLAMA_KARAKTER.max} karakterden sonrasını keser.`);
  else ekle("aciklama-uzunluk", "seo", "iyi", `Açıklama uzunluğu iyi: ${aciklama.length} karakter.`);

  if (kelime >= ICERIK_KELIME.onerilen) ekle("icerik-uzunluk", "seo", "iyi", `Metin ${kelime} sözcük; yeterli uzunlukta.`);
  else if (kelime >= ICERIK_KELIME.enAz) ekle("icerik-uzunluk", "seo", "orta", `Metin ${kelime} sözcük; ${ICERIK_KELIME.onerilen}+ sözcük önerilir.`);
  else ekle("icerik-uzunluk", "seo", "kotu", `Metin ${kelime} sözcük; çok kısa (en az ${ICERIK_KELIME.enAz}, önerilen ${ICERIK_KELIME.onerilen}+).`);

  if (icB >= 2) ekle("ic-baglanti", "seo", "iyi", `${icB} site içi bağlantı var.`);
  else ekle("ic-baglanti", "seo", icB === 1 ? "orta" : "kotu", `${icB} site içi bağlantı var; ilgili yazılara ya da eğitim sayfalarına en az 2 bağlantı verin.`);

  ekle(
    "dis-baglanti",
    "seo",
    disB >= 1 ? "iyi" : "orta",
    disB >= 1 ? `${disB} dış kaynak bağlantısı var.` : "Dış kaynak bağlantısı yok; güvenilir bir kaynağa en az 1 bağlantı verin.",
  );

  const altsiz = gorseller.filter((x) => !x.alt).length;
  if (!gorseller.length) ekle("gorsel-alt", "seo", "orta", "Yazıda görsel yok.");
  else if (altsiz) ekle("gorsel-alt", "seo", "kotu", `Açıklaması (alt metni) eksik görsel: ${altsiz} / ${gorseller.length}.`);
  else ekle("gorsel-alt", "seo", "iyi", `Tüm görsellerde (${gorseller.length}) alt metin var.`);

  ekle(
    "h1-yok",
    "seo",
    c.h1Sayisi ? "kotu" : "iyi",
    c.h1Sayisi ? `Gövdede H1 başlık var (${c.h1Sayisi}); yazı başlığı tek H1 olmalı, gövdede H2 kullanın.` : "Gövdede H1 yok (başlık tek H1).",
  );

  // Okunabilirlik
  const cumleler = cumlelereAyir(c.metin);
  if (cumleler.length) {
    const uzunluklar = cumleler.map((x) => sozcuklereAyir(x).length);
    const ort = yuzde(uzunluklar.reduce((t, v) => t + v, 0) / uzunluklar.length);
    const uzunPay = Math.round((uzunluklar.filter((v) => v > CUMLE_KELIME.orta).length / uzunluklar.length) * 100);
    if (ort <= CUMLE_KELIME.iyi && uzunPay <= 25) ekle("cumle-uzunluk", "okunabilirlik", "iyi", `Ortalama cümle ${ort} sözcük; okunaklı.`);
    else if (ort <= CUMLE_KELIME.orta) ekle("cumle-uzunluk", "okunabilirlik", "orta", `Ortalama cümle ${ort} sözcük; cümlelerin %${uzunPay}'i ${CUMLE_KELIME.orta} sözcükten uzun.`);
    else ekle("cumle-uzunluk", "okunabilirlik", "kotu", `Ortalama cümle ${ort} sözcük; cümleleri bölün (önerilen ≤ ${CUMLE_KELIME.iyi}).`);
  } else ekle("cumle-uzunluk", "okunabilirlik", "orta", "Henüz cümle yok.");

  if (c.paragraflar.length) {
    const uzun = c.paragraflar.filter((p) => sozcuklereAyir(p).length > PARAGRAF_KELIME).length;
    ekle(
      "paragraf-uzunluk",
      "okunabilirlik",
      uzun === 0 ? "iyi" : uzun === 1 ? "orta" : "kotu",
      uzun === 0 ? "Paragraflar kısa ve okunaklı." : `${uzun} paragraf ${PARAGRAF_KELIME} sözcükten uzun; bölün.`,
    );
  }

  if (kelime >= ICERIK_KELIME.enAz) {
    const basina = c.altBasliklar.length ? Math.round(kelime / (c.altBasliklar.length + 1)) : kelime;
    ekle(
      "altbaslik-dagilim",
      "okunabilirlik",
      basina <= 300 ? "iyi" : basina <= 450 ? "orta" : "kotu",
      basina <= 300 ? "Alt başlıklar metne dengeli dağılmış." : `Alt başlıklar arası ortalama ${basina} sözcük; 300 sözcükte bir alt başlık önerilir.`,
    );
  }

  const puan = {
    seo: puanla(k.filter((x) => x.grup === "seo")),
    okunabilirlik: puanla(k.filter((x) => x.grup === "okunabilirlik")),
  };
  return {
    kontroller: k,
    puan,
    durum: { seo: odakVar ? puanDurumu(puan.seo) : "kotu", okunabilirlik: puanDurumu(puan.okunabilirlik) },
    istatistik: {
      kelime,
      odakSayisi,
      yogunluk,
      baslikPiksel: piksel,
      baslikKarakter: gorunen.length,
      aciklamaKarakter: aciklama.length,
      icBaglanti: icB,
      disBaglanti: disB,
      gorsel: gorseller.length,
    },
  };
}

/** Önce kötü, sonra orta, sonra iyi. */
export function kontrolleriSirala(k: SeoKontrol[]): SeoKontrol[] {
  const sira: Record<Durum, number> = { kotu: 0, orta: 1, iyi: 2 };
  return [...k].sort((a, b) => sira[a.durum] - sira[b.durum]);
}
