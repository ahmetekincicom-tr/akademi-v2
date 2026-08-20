import "server-only";

import { epostaGonder } from "@/lib/eposta";

/**
 * Sunucu hatalarını görünür kılar.
 *
 * Şimdiye kadar canlıdaki bir hatayı öğrenmenin tek yolu, birinin
 * "çalışmıyor" demesiydi. Vercel günlükleri duruyor ama kimse okumuyor;
 * okunmayan bir günlük, olmayan bir günlükle aynı şey.
 *
 * Üçüncü parti bir servis (Sentry vb.) kurulmadı: bu ölçekte tek ihtiyaç
 * "bir şey patladı, git bak" demek ve bunu yapan bir e-posta altyapısı
 * zaten var. Bağımlılık, ücret ve üçüncü bir yerde duran kullanıcı verisi
 * getirmeyen çözüm bu.
 */

/*
  Aynı hatayı tekrar tekrar postalamamak için basit bir bastırma.

  Bir sayfa bozulduğunda hata her istekte tekrarlanıyor; bastırma olmasa
  bir saatte yüzlerce mail giderdi ve o kutu okunmaz hale gelirdi — yani
  bildirim, bildirmemekle aynı sonuca varırdı.

  Bellekte tutuluyor, kalıcı değil: sunucusuz ortamda her örnek kendi
  sayacını tutuyor ve dağıtımda sıfırlanıyor. Kesin bir sayaç değil,
  gürültü kesici. Kesinlik isteseydik veritabanına yazmak gerekirdi ve
  hata bildirimi, hata verebilecek bir işe bağlanmış olurdu.
*/
const SUSTURMA_MS = 15 * 60 * 1000;
const sonGonderim = new Map<string, number>();

/** Haritanın sınırsız büyümemesi için; farklı hata sayısı bunu aşmaz. */
const EN_FAZLA_ANAHTAR = 200;

function susturulmusMu(anahtar: string): boolean {
  const simdi = Date.now();
  const onceki = sonGonderim.get(anahtar);

  if (onceki && simdi - onceki < SUSTURMA_MS) return true;

  if (sonGonderim.size >= EN_FAZLA_ANAHTAR) sonGonderim.clear();
  sonGonderim.set(anahtar, simdi);
  return false;
}

export type HataBaglami = {
  /** İsteğin yolu: /panel/odemelerim gibi. */
  yol?: string;
  /** Nerede oluştu: sayfa çizimi, sunucu eylemi, API yolu. */
  nerede?: string;
  method?: string;
};

/**
 * Hatayı bildirir. ASLA hata fırlatmaz.
 *
 * Bildirim yolunun kendisi patlarsa asıl hatanın üstüne ikinci bir hata
 * binmiş olurdu; çağıran yerler zaten bir şeyin ters gittiği noktada.
 */
export async function hataBildir(hata: unknown, baglam: HataBaglami = {}): Promise<void> {
  try {
    const mesaj = hata instanceof Error ? hata.message : String(hata);
    const yigin = hata instanceof Error ? (hata.stack ?? "") : "";

    // Konsol her durumda yazılıyor: mail kapalı ya da yapılandırılmamış
    // olabilir, Vercel günlüğü ise her zaman var.
    console.error("[hata]", baglam.nerede ?? "?", baglam.yol ?? "?", mesaj);

    // Anahtar mesaj + yol: aynı sayfadaki aynı hata tek bildirim sayılıyor.
    if (susturulmusMu(`${baglam.yol ?? ""}|${mesaj}`)) return;

    await epostaGonder({
      akis: "sistem-hatasi",
      konu: `Sistem hatası · ${baglam.yol ?? baglam.nerede ?? "sunucu"}`,
      metin: [
        mesaj,
        "",
        `Yol: ${baglam.yol ?? "—"}`,
        `Yer: ${baglam.nerede ?? "—"}`,
        `Yöntem: ${baglam.method ?? "—"}`,
        `Zaman: ${new Date().toISOString()}`,
        "",
        // Yığın kırpılıyor: e-postada okunacak kısım ilk birkaç satır,
        // gerisi zaten Vercel günlüğünde tam hâliyle duruyor.
        yigin.split("\n").slice(0, 12).join("\n"),
        "",
        `Aynı hata ${SUSTURMA_MS / 60000} dakika boyunca tekrar bildirilmeyecek.`,
      ].join("\n"),
    });
  } catch {
    // Bildirim yolu sessizce pes ediyor; konsola zaten yazıldı.
  }
}
