/**
 * WordPress'ten taşınan yazılardaki görsel adresleri.
 *
 * Yazılar Supabase'e taşındı ama gövdelerindeki görseller hâlâ eski
 * WordPress sunucusundan geliyor (`/wp-content/uploads/...`, kimi `http://`
 * ile). Bu sürdükçe WordPress kapatılamıyor ve `http://` adresleri karışık
 * içerik uyarısı üretiyor.
 *
 * Taşıma üç adım (yönetim → Blog → WordPress taşıma):
 *   1. Tara: yazılarda geçen her WordPress görselini bul.
 *   2. Kopyala: dosyaları `kapaklar` kovasına, `blog/wp/YYYY/AA/dosya` altına.
 *   3. Adresleri güncelle: yalnız kopyası doğrulanmış görsellerin adresi
 *      `/dosya/kapaklar/blog/wp/...` olur.
 *
 * Bu dosya saf: desen, yol dönüşümü ve metin içi değiştirme.
 */

/*
  Üç biçim yakalanıyor:
    http(s)://(www.|wp.)ahmetekinciakademi.com/wp-content/uploads/...
    //ahmetekinciakademi.com/wp-content/uploads/...
    /wp-content/uploads/...     (yalnız tırnak, parantez, boşluk ya da = sonrası:
                                 başka bir alan adının ortasında yakalanmasın)
  Dosya yolu boşlukta, tırnakta, parantezde, virgülde (srcset) ya da sorguda biter.
*/
const DESEN =
  /(?:(?:https?:)?\/\/(?:www\.|wp\.)?ahmetekinciakademi\.com|(?<=["'(\s=,]|^))\/wp-content\/uploads\/([^"'\s)<>?#,]+)(?:\?[^"'\s)<>,]*)?/g;

/** Metinde geçen WordPress yükleme yolları ("2026/02/gorsel.png"), tekrarsız. */
export function wpGorselleriBul(metin: string): string[] {
  const bulunan = new Set<string>();
  for (const m of metin.matchAll(DESEN)) bulunan.add(m[1]);
  return [...bulunan];
}

/**
 * WordPress yolunun depodaki karşılığı.
 *
 * Klasör yapısı (yıl/ay) korunuyor, dosya adı ASCII'ye çevriliyor: depolama
 * anahtarında Türkçe harf ve boşluk sorun çıkarıyor. Dönüşüm belirlenimci;
 * aynı WordPress yolu her zaman aynı depo yoluna düşer, araç ikinci kez
 * çalışınca kopyayı yeniden yapmaz.
 */
export function wpDepoYolu(wpYol: string): string {
  let cozulmus = wpYol;
  try {
    cozulmus = decodeURIComponent(wpYol);
  } catch {
    // Bozuk kodlama: olduğu gibi.
  }
  const TR: Record<string, string> = { ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I", ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U" };
  const parcalar = cozulmus.split("/").filter(Boolean);
  const temiz = parcalar.map((p) =>
    p
      .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR[c] ?? c)
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-(?=\.)|-$/g, ""),
  );
  return `blog/wp/${temiz.join("/")}`;
}

/** Görselin WordPress sunucusundaki indirme adresi. */
export function wpIndirmeAdresi(kaynak: string, wpYol: string): string {
  const yol = /%[0-9A-Fa-f]{2}/.test(wpYol) ? wpYol : encodeURI(wpYol);
  return `${kaynak.replace(/\/$/, "")}/wp-content/uploads/${yol}`;
}

/** Depo yolunun sitedeki adresi (lib/depo.ts → depoUrl ile aynı biçim). */
export function depoSiteAdresi(depoYolu: string): string {
  return `/dosya/kapaklar/${depoYolu.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Metindeki WordPress görsel adreslerini, kopyası doğrulanmış olanlar için
 * kendi adresimize çevirir. Kopyalanmamış olana dokunmuyor: yarım kalmış bir
 * taşıma, kırık görsel bırakmasın.
 */
export function wpAdresleriniDegistir(metin: string, tasinan: ReadonlySet<string>): string {
  return metin.replace(DESEN, (tam, wpYol: string) => (tasinan.has(wpYol) ? depoSiteAdresi(wpDepoYolu(wpYol)) : tam));
}

/**
 * Kapak alanı depo YOLU tutuyor (kapakUrl onu adrese çeviriyor); WordPress'ten
 * gelenlerde ise tam adres yazılı. Taşınmışsa depo yoluna çevrilir.
 */
export function wpKapakYolu(kapak: string | null, tasinan: ReadonlySet<string>): string | null {
  if (!kapak) return kapak;
  const [wpYol] = wpGorselleriBul(kapak);
  if (!wpYol || !tasinan.has(wpYol)) return kapak;
  return wpDepoYolu(wpYol);
}
