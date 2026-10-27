/**
 * Panelden ve kendiliğinden yazılan adres yönlendirmeleri — eşleştirme.
 *
 * Tablo veritabanında (`yonlendirmeler`), okuyan ara katman (src/proxy.ts).
 * Bu dosya saf: tabloyu kurar, gelen yolu kaynağa çevirir, eşleşeni bulur.
 * Önbellek ve ağ işi lib/yonlendirme-onbellek.ts'te.
 *
 * Elle yazılmış kalıcı taşıma listesi (lib/tasima.ts) bundan ayrı ve önce
 * çalışıyor (next.config.ts → redirects). Aynı adres iki yerde varsa
 * next.config'deki kazanır.
 */

export type Yonlendirme = { hedef: string | null; kod: 301 | 410 };
export type YonlendirmeTablosu = ReadonlyMap<string, Yonlendirme>;

export type YonlendirmeSatiri = { kaynak: string; hedef: string | null; kod: number };

/**
 * Yönlendirmenin HİÇ uygulanmadığı kökler.
 *
 * Panel, yönetim, oturum akışı ve API bir yönlendirme satırıyla
 * kapatılabilseydi, yanlış yazılmış tek bir satır yönetim paneline girişi
 * kilitleyebilirdi — o satırı düzeltecek ekran da panelde.
 */
const DOKUNULMAZ_KOKLER = [
  "/kontrol-9f4x2k",
  "/panel",
  "/api",
  "/auth",
  "/giris",
  "/kayit",
  "/sifremi-unuttum",
  "/sifre-belirle",
  "/dosya",
  "/indir",
  "/destek-ek",
  "/_next",
];

/** Bu yol için yönlendirme tablosuna bakmaya değer mi? */
export function yonlendirmeAranir(yol: string): boolean {
  if (yol === "/" || !yol.startsWith("/")) return false;
  return !DOKUNULMAZ_KOKLER.some((k) => yol === k || yol.startsWith(k + "/"));
}

/**
 * Gelen yolu tablodaki kaynak biçimine çevirir: "/adres/".
 *
 * Sitede trailingSlash açık, ara katmana gelen yol zaten çizgili; yine de
 * çizgisiz gelen (dosya uzantılı olmayan) yol aynı satırla eşleşsin.
 * Büyük/küçük harf korunuyor: slug'lar küçük harf ve "/Meta/" ile "/meta/"
 * ayrı adresler.
 */
export function kaynakAnahtari(yol: string): string {
  let temiz = yol;
  try {
    temiz = decodeURI(yol);
  } catch {
    // Bozuk kodlanmış yol: olduğu gibi.
  }
  return temiz.endsWith("/") ? temiz : `${temiz}/`;
}

export function tabloKur(satirlar: YonlendirmeSatiri[]): YonlendirmeTablosu {
  const tablo = new Map<string, Yonlendirme>();
  for (const s of satirlar) {
    // Kaynak, gelen yolla aynı biçime çevriliyor: panelde kodlanmış
    // (%C3%A7) ya da düz (ç) yazılmış olsun, aynı adresle eşleşsin.
    const anahtar = kaynakAnahtari(s.kaynak);
    if (s.kod === 410) tablo.set(anahtar, { hedef: null, kod: 410 });
    else if (s.kod === 301 && s.hedef) tablo.set(anahtar, { hedef: s.hedef, kod: 301 });
  }
  return tablo;
}

export function yonlendirmeBul(tablo: YonlendirmeTablosu, yol: string): Yonlendirme | null {
  if (!yonlendirmeAranir(yol)) return null;
  return tablo.get(kaynakAnahtari(yol)) ?? null;
}

/**
 * Yönlendirmenin varacağı tam adres. İstekteki sorgu dizgisi (utm_*, fbclid)
 * taşınıyor: yoksa reklam ve kampanya bağlantılarının ölçümü yönlendirmede
 * kaybolurdu. Hedef kendi sorgusunu taşıyorsa ona dokunulmuyor.
 */
export function hedefAdresi(hedef: string, istekAdresi: string): URL {
  const istek = new URL(istekAdresi);
  const varis = new URL(hedef, istek);
  if (!varis.search && istek.search) varis.search = istek.search;
  return varis;
}

/**
 * Panelde girilen hedef adresi tablo biçimine çevirir; geçersizse null.
 *
 *   "meta-capi-nedir"                       → "/meta-capi-nedir/"
 *   "https://ahmetekinciakademi.com/blog"   → "/blog/"   (kendi alan adımız göreli yazılır)
 *   "/iletisim/?konu=a"                     → olduğu gibi
 *   "https://ahmetekinci.com.tr/x/"         → olduğu gibi (dış adres, yalnız https)
 *
 * Sondaki çizgi ekleniyor: sitede trailingSlash açık, çizgisiz hedef bir
 * sıçrama daha demek.
 */
export function hedefDuzenle(girdi: string): string | null {
  let h = girdi.trim();
  if (!h) return null;
  const kendi = /^https?:\/\/(www\.|panel\.)?ahmetekinciakademi\.com(?=\/|$)/i;
  if (kendi.test(h)) h = h.replace(kendi, "") || "/";
  if (/^https:\/\/[^\s/]+\.[^\s/]+/i.test(h)) return /\s/.test(h) ? null : h;
  if (/^[a-z]+:/i.test(h) || h.startsWith("//") || /\s/.test(h)) return null;
  if (!h.startsWith("/")) h = `/${h}`;
  const [yol, ...sorgu] = h.split(/(?=[?#])/);
  const sonParca = yol.split("/").pop() ?? "";
  const cizgili = yol.endsWith("/") || sonParca.includes(".") ? yol : `${yol}/`;
  return cizgili + sorgu.join("");
}

/** Panelde girilen kaynak yol: "/adres/" biçimi; sorgu ve dış adres kabul edilmez. */
export function kaynakDuzenle(girdi: string): string | null {
  const h = hedefDuzenle(girdi);
  if (!h || !h.startsWith("/") || /[?#]/.test(h) || h === "/") return null;
  return h.endsWith("/") ? h : null;
}
