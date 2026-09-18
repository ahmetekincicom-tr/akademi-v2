import { slugYap } from "@/lib/duyuru";

/**
 * Yüklenen blog görselleri için SEO uyumlu dosya adı ve Storage yolu.
 *
 * `CleanShot 2026-09-19 at 01.20.35.png` / `IMG_2938.jpg` gibi isimler
 * Storage'a olduğu gibi gitmiyor. Ad şu öncelikle üretiliyor: kullanıcının
 * verdiği özel ad → caption → alt text → yazının slug'ı. slugYap zaten Türkçe
 * karakterleri normalize edip küçük harfe indiriyor, boşlukları tireye çeviriyor
 * ve ardışık tireleri temizliyor (lib/duyuru.ts).
 *
 * Benzersizlik kısa bir rastgele son ekle çözülüyor (ör. `-a83f`): Storage'a
 * "var mı" sorusu sormadan çakışma olasılığı yok denecek kadar düşük kalıyor ve
 * ad İLK yüklemede sabitleniyor — caption sonradan değişse bile dosya yeniden
 * adlandırılmıyor (URL kırılmasın diye).
 */

/** 4 haneli onaltılık son ek: anlamlı ad + kısa benzersiz ek. */
function kisaEk(): string {
  const b = new Uint8Array(2);
  (globalThis.crypto ?? crypto).getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Kaynak metinlerden SEO uyumlu bir taban ad üretir. İlk dolu olan kaynak
 * kullanılıyor; hepsi boşsa "gorsel".
 */
export function seoTabanAd(kaynaklar: {
  ozelAd?: string | null;
  caption?: string | null;
  alt?: string | null;
  yaziSlug?: string | null;
}): string {
  const aday = [kaynaklar.ozelAd, kaynaklar.caption, kaynaklar.alt, kaynaklar.yaziSlug]
    .map((s) => (s ?? "").trim())
    .find((s) => s.length > 0);
  // slugYap 70 karaktere kırpıyor; dosya adı için biraz daha kısa tutuyoruz.
  const taban = slugYap(aday ?? "").slice(0, 60).replace(/-+$/g, "");
  return taban || "gorsel";
}

/**
 * Tam Storage yolunu üretir: `blog/{yıl}/{ay}/{ad}-{ek}.{uzanti}`.
 * Ad ve uzantı sanitize; yol kullanıcı girdisiyle kirletilmiyor.
 */
export function storageYolu(tabanAd: string, uzanti: string, tarih = new Date()): string {
  const yil = tarih.getFullYear();
  const ay = String(tarih.getMonth() + 1).padStart(2, "0");
  const temizUzanti = uzanti.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const ad = (slugYap(tabanAd).slice(0, 60).replace(/-+$/g, "") || "gorsel");
  return `blog/${yil}/${ay}/${ad}-${kisaEk()}.${temizUzanti}`;
}
