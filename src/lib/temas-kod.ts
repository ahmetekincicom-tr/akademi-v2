/**
 * WhatsApp mesajına gömülen takip kodu.
 *
 * Bu dosya hem sunucuda hem tarayıcıda çalışıyor — bilerek: kod artık
 * TIKLAMA ANINDA tarayıcıda üretiliyor (bkz. WhatsAppBaglantisi), eski
 * yönlendirme ucu ise sunucuda üretmeye devam ediyor. Alfabenin ve
 * uzunluğun tek yerde durması, ikisinin birbirinden ayrılmasını önlüyor.
 */

/**
 * Karışabilen harfler yok: 0/O, 1/I/l.
 *
 * Kod insan eliyle okunup yazılıyor — yönetici WhatsApp'ta görüp panele
 * yapıştırıyor. "0" ile "O"yu ayırt etmek zorunda kalmamalı.
 */
export const KOD_ALFABESI = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/*
  6 karakter. Kod, yazıldığı satırdan ÖNCE mesaja gömülüyor; yani çakışma
  hâlinde yeni bir kodla tekrar denemek mümkün değil (kullanıcının elindeki
  mesajda yazan kod o olmaz). Bir hane eklemek çakışma ihtimalini 32 kat
  düşürüyor: 32^6 ≈ 1,07 milyar, on bin temasta beklenen çakışma 0,05'in
  altında. Eski 5 haneli kodlar geçerliliğini koruyor — sütunda uzunluk
  kısıtı yok, yalnızca benzersizlik var.
*/
export const KOD_UZUNLUK = 6;

/** Panele yapıştırılan kod bu biçimde mi? Sunucu tarafında doğrulama için. */
export function kodGecerliMi(deger: unknown): deger is string {
  return (
    typeof deger === "string" &&
    deger.length === KOD_UZUNLUK &&
    [...deger].every((h) => KOD_ALFABESI.includes(h))
  );
}

/**
 * Rastgele kod.
 *
 * Web Crypto kullanılıyor: hem Node'da hem tarayıcıda aynı API. Math.random
 * bilerek yok — tahmin edilebilir bir kod, başkasının temasının üzerine
 * yazmayı mümkün kılardı.
 *
 * Modülo sapması önleniyor: 256, 32'ye tam bölündüğü için alfabenin her
 * harfi eşit olasılıkla çıkıyor. (Alfabe uzunluğu değişirse bu artık doğru
 * olmaz; aşağıdaki kontrol onu derleme değil çalışma anında yakalar.)
 */
export function kodUret(): string {
  if (256 % KOD_ALFABESI.length !== 0) {
    throw new Error("KOD_ALFABESI uzunluğu 256'yı tam bölmeli; yoksa harfler eşit dağılmaz.");
  }
  const baytlar = new Uint8Array(KOD_UZUNLUK);
  crypto.getRandomValues(baytlar);
  let kod = "";
  for (const bayt of baytlar) kod += KOD_ALFABESI[bayt % KOD_ALFABESI.length];
  return kod;
}

/** Mesajın sonuna takip kodunu ekler. */
export function kodluMesaj(mesaj: string, kod: string): string {
  /*
    Kod parantez içinde ve SONDA: kişi mesajın başına kendi cümlesini yazsa
    bile kod kalıyor, çünkü insanlar hazır metnin sonuna değil önüne yazıyor.
  */
  return `${mesaj} (Ref: ${kod})`;
}
