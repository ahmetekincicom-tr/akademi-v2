/**
 * Google reklam kimliklerini çerezlerden çıkarır.
 *
 * gtag.js (Olcumleme.tsx) yüklü olduğunda:
 *  - `_ga`      → GA4 client_id. Biçim: `GA1.1.<client_id>` ve client_id de
 *                 kendi içinde nokta taşır (`1234567890.1234567890`).
 *  - `_gcl_aw`  → Google Ads tık kimliği. Biçim: `GCL.<zaman>.<gclid>`.
 *                 Conversion Linker (gtag'in parçası) reklamdan gelişte otomatik
 *                 yazıyor; yani ayrıca URL okumaya gerek yok.
 *
 * Saf fonksiyonlar: girdi çerez değeri, çıktı kimlik ya da null. Beklenmeyen
 * biçimde null döner (çöp değeri profile/loga taşımıyoruz).
 */

/** `_ga` çerezinden GA4 client_id ("1234567890.1234567890"). */
export function gaClientId(gaCerez: string | null | undefined): string | null {
  if (!gaCerez) return null;
  // GA1.<domainDepth>.<client_id...>. İlk iki parça atılır, kalanı client_id.
  const parcalar = gaCerez.split(".");
  if (parcalar.length < 4 || parcalar[0] !== "GA1") return null;
  const id = parcalar.slice(2).join(".");
  return /^\d+\.\d+$/.test(id) ? id : null;
}

/** `_gcl_aw` çerezinden gclid. */
export function gclidCoz(gclCerez: string | null | undefined): string | null {
  if (!gclCerez) return null;
  // GCL.<zaman>.<gclid>. gclid genelde noktasız; yine de kalan tümü alınır.
  const parcalar = gclCerez.split(".");
  if (parcalar.length < 3 || parcalar[0] !== "GCL") return null;
  const gclid = parcalar.slice(2).join(".");
  // gclid base64url benzeri; beklenmeyen karakter varsa yok say.
  return /^[\w-]{10,}$/.test(gclid) ? gclid : null;
}
