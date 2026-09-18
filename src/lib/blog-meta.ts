/**
 * Blog meta yardımcıları: okuma süresi ve tarih biçimleme.
 *
 * Saf fonksiyonlar (girdi → çıktı), test edilebilir. UI ile schema aynı
 * kaynaktan beslensin diye tarih/gün karşılaştırma mantığı tek yerde.
 */

/** Kaba HTML→metin (etiketleri at, varlıkları çöz, boşlukları sıkıştır). */
function metneCevir(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Okuma süresi (dakika). ~200 kelime/dk; en az 1 dk. Türkçe ortalama okuma
 * hızına yakın, ekran görüntüsü/kod ağırlıklı yazılarda da makul.
 */
export function okumaSuresi(html: string): number {
  const metin = metneCevir(html);
  if (!metin) return 1;
  const kelime = metin.split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(kelime / 200));
}

const UZUN = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

/** "27 Ağustos 2026" — geçersiz/boş tarihte boş string. */
export function tarihUzun(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : UZUN.format(d);
}

/** `<time datetime>` için "2026-08-27" — geçersizse boş. */
export function tarihIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** İki tarihin takvim günü (UTC) aynı mı — anlamlı fark eşiği gün bazında. */
function ayniGun(a: string, b: string): boolean {
  return tarihIso(a) === tarihIso(b);
}

/**
 * "Güncellendi" gösterilecek mi? İçerik güncelleme tarihi, yayın tarihinden
 * SONRAKİ bir GÜNdeyse gösterilir; aynı gün ya da yoksa gösterilmez (spec #6).
 * Döndürdüğü değer varsa gösterilecek ISO tarihidir.
 */
export function guncellemeGosterilecek(
  yayinTarihi: string | null,
  icerikGuncelleme: string | null,
): string | null {
  if (!icerikGuncelleme) return null;
  if (!yayinTarihi) return icerikGuncelleme;
  if (ayniGun(yayinTarihi, icerikGuncelleme)) return null;
  // Güncelleme yayından önce görünüyorsa (veri tutarsızlığı) gösterme.
  if (new Date(icerikGuncelleme).getTime() <= new Date(yayinTarihi).getTime()) return null;
  return icerikGuncelleme;
}

/** Schema dateModified değeri: gerçek içerik güncellemesi yoksa yayın tarihi. */
export function dateModifiedDegeri(
  yayinTarihi: string | null,
  icerikGuncelleme: string | null,
  teknikGuncelleme: string,
): string {
  return icerikGuncelleme ?? yayinTarihi ?? teknikGuncelleme;
}
