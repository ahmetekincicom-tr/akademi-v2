/**
 * Onay kayıtlarının tipleri ve etiketleri.
 *
 * lib/riza.ts'ten ayrı duruyor çünkü orası "server-only": servis anahtarını
 * kullanan yazma yolunu barındırıyor ve tarayıcı paketine hiç girmemeli. Ama
 * onayları GÖSTEREN bileşenlerin bir kısmı client — yönetimdeki öğrenci
 * detayı gibi. Tip ve etiket ikisinin de ihtiyacı olan, sır içermeyen kısım.
 */

export type RizaBaglami = "kayit" | "odeme" | "gorusme";

export type RizaKaydi = {
  id: string;
  belge: string;
  baglam: RizaBaglami;
  baslik: string;
  tarih: string;
  belgeGuncelleme: string | null;
  ozet: string | null;
};

/** Onayın hangi adımda alındığı. */
export const BAGLAM_ETIKET: Record<RizaBaglami, string> = {
  kayit: "Üyelik",
  odeme: "Ödeme",
  gorusme: "Danışmanlık",
};

/** Başlığı kaydedilmemiş ya da metni silinmiş belgeler için yedek ad. */
export const BELGE_ADI: Record<string, string> = {
  "uyelik-sozlesmesi": "Üyelik ve Kullanım Sözleşmesi",
  "kisisel-verilerin-islenmesi": "KVKK Aydınlatma Metni",
  "gizlilik-politikasi": "Gizlilik Politikası",
  "satis-sozlesmesi": "Mesafeli Satış Sözleşmesi",
  "iptal-iade-politikasi": "İptal ve İade Politikası",
  "ticari-ileti-izni": "Ticari elektronik ileti izni",
};
