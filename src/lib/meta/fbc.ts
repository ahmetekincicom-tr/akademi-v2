/**
 * Meta tıklama kimliği (_fbc) ve ilgili çerez adları.
 *
 * Ayrı bir dosyada, çünkü proxy.ts (ara katman) Edge çalışma zamanında
 * çalışıyor ve orada node:crypto yüklenemiyor. kimlik.ts hash'leme için
 * crypto'ya bağlı; ara katmanın ondan haberi bile olmamalı.
 */

/** Meta'nın tarayıcı çerezleri. Pixel bu adlarla yazıyor, biz de aynısını okuyoruz. */
export const FBP_CEREZI = "_fbp";
export const FBC_CEREZI = "_fbc";

/**
 * _fbc çerezinin ömrü: 90 gün.
 *
 * Meta'nın kendi pixel'i de bu süreyi kullanıyor ve attribution penceresiyle
 * uyumlu. Daha uzunu, artık ilişkilendirilemeyecek bir tıklamayı taşımak
 * olurdu.
 */
export const FBC_OMRU_SN = 90 * 24 * 60 * 60;

/**
 * Meta tıklama kimliği biçimi: `fb.1.<zaman damgası>.<fbclid>`
 *
 * Ham fbclid tek başına gönderilemiyor; Meta bu sarmalı bekliyor ve yanlış
 * biçimdeki değeri SESSİZCE yok sayıyor — hata dönmüyor, sadece eşleşme
 * olmuyor. Bu yüzden biçim burada tek yerde kuruluyor.
 *
 * Ortadaki "1" alan adı seviyesi; tek alan adında her zaman 1.
 */
export function fbcKur(fbclid: string, zaman: number = Date.now()): string | null {
  const temiz = fbclid.trim();
  // fbclid base64url benzeri bir dizge; beklenmeyen karakter varsa dokunma.
  // Reklam bağlantısına elle bir şey eklenmiş olabilir ve onu çereze yazmak,
  // sonradan Meta'ya gönderilecek bir değeri dışarıdan yazdırmak demek.
  if (!temiz || temiz.length > 400 || !/^[\w.-]+$/.test(temiz)) return null;
  return `fb.1.${zaman}.${temiz}`;
}
