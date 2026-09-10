/**
 * Panelden gelen bir alanın hangi değerle kaydedileceği.
 *
 * ————————————————————————————————————————————————————————————
 * NEDEN AYRI BİR DOSYADA VE TESTLİ
 *
 * Bu kural iki kez yanlış yazıldı ve ikisi de sessizce geçti:
 *
 *  1. hero_aciklama sütunu HİÇ güncellenmiyordu; değeri her zaman mevcut
 *     kayıttan alınıyordu. Panelde alan olsa da olmasa da yazdığınız şey
 *     kaybediyordu.
 *  2. Düzeltme yazıldı ama dosyaya uygulanmadı — kaydetme yolu alanı yok
 *     saymaya devam etti. Sayfa tarafı geri düşüş sayesinde doğru
 *     göründüğü için ölçüm de yanlış yere baktı: ekran düzelmişti, kayıt
 *     düzelmemişti.
 *
 * İkisinin ortak sebebi kuralın kaydetme yolunun içine gömülü olmasıydı:
 * orası bir sunucu eylemi ("use server"), yalnızca async fonksiyon dışa
 * açabiliyor, dolayısıyla kural test edilemiyordu. Burada saf bir fonksiyon
 * olarak duruyor ve testi var.
 */

/**
 * Metin alanı için kaydedilecek değer.
 *
 * @param girilen   Editörden gelen değer. `undefined` = "bu alan gönderilmedi,
 *                  mevcut değeri koru". Boş metin GEÇERLİ bir değerdir:
 *                  "bu metni sil" demek.
 * @param mevcut    Veritabanındaki mevcut değer (yeni kayıtta yok).
 * @param yedek     İkisi de yoksa kullanılacak değer. Örneğin hero cümlesi
 *                  için kısa açıklama.
 */
export function kaydedilecekMetin(
  girilen: string | undefined,
  mevcut: string | null | undefined,
  yedek = "",
): string {
  if (girilen !== undefined) return girilen.trim();
  /*
    BOŞ METİN NULL DEĞİL. Eskiden burada `mevcut ?? yedek` yazıyordu ve
    veritabanındaki boş string `??`yi tetiklemediği için yedek hiç devreye
    girmiyordu: hero cümlesi boş olan bir eğitimde alan kalıcı olarak boş
    kalıyordu. Kontrol "dolu mu" olmalı, "null mı" değil.
  */
  const temiz = (mevcut ?? "").trim();
  return temiz || yedek.trim();
}

/**
 * İşaret (checkbox) alanı için kaydedilecek değer.
 *
 * Aynı kural: `undefined` = gönderilmedi. `false` geçerli bir değer, o yüzden
 * `||` ile varsayılana düşmek yanlış olur.
 */
export function kaydedilecekIsaret(
  girilen: boolean | undefined,
  mevcut: boolean | undefined,
  varsayilan = false,
): boolean {
  if (girilen !== undefined) return girilen;
  return mevcut ?? varsayilan;
}
