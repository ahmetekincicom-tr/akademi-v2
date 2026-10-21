import { createHmac, timingSafeEqual } from "node:crypto";
import type { AbonelikDetayi, AbonelikDurumu } from "@/lib/iyzico-abonelik";
import type { Satir } from "@/lib/supabase/tipler";

/**
 * Abonelik kararlarının saf hâli — veritabanı ve ağ yok, test edilebilir.
 *
 * Erişim kuralı burada TEK yerde: iyzico'nun bildirimi, ödeme formunun dönüşü,
 * mutabakat görevi ve yöneticinin "iyzico'ya sor" düğmesi hepsi aynı
 * fonksiyondan geçiyor. Kural üç yerde ayrı yazılsaydı biri mutlaka farklı
 * davranırdı ve fark ettiğimiz yer, ödediği halde izleyemeyen biri olurdu.
 */

export type AbonelikDurumKodu = "bekliyor" | "aktif" | "odeme_alinamadi" | "iptal" | "sona_erdi" | "basarisiz";

export type AbonelikAyari = {
  /** Katılımcılara açık mı. Kapalıyken yalnızca yönetici görür. */
  acik: boolean;
  /** Açıkken iyzico'nun test ortamı kullanılır ve abonelik yalnızca yöneticiye görünür. */
  testModu: boolean;
  /** iyzico'daki ödeme planının referans kodu (canlı). */
  planKodu: string;
  /** Test ortamındaki planın kodu. */
  testPlanKodu: string;
  /** Sayfada gösterilen aylık ücret. Asıl tutar iyzico'daki planda. */
  fiyat: number;
  /** Yenileme reddedildiğinde izlemenin açık kaldığı gün sayısı. */
  ekSureGun: number;
};

export const VARSAYILAN_AYAR: AbonelikAyari = {
  acik: false,
  testModu: true,
  planKodu: "",
  testPlanKodu: "",
  fiyat: 0,
  ekSureGun: 3,
};

/** settings.abonelik satırını okur; eksik ya da bozuk alanlar varsayılana düşer. */
export function abonelikAyariniCoz(ham: unknown): AbonelikAyari {
  const d = (ham && typeof ham === "object" ? ham : {}) as Record<string, unknown>;
  const sayi = (v: unknown, varsayilan: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : varsayilan;
  };
  return {
    acik: d.acik === true,
    // Varsayılan TEST: ayar satırı bozulursa gerçek karttan para çekilmesindense
    // abonelik çalışmasın.
    testModu: d.testModu !== false,
    planKodu: typeof d.planKodu === "string" ? d.planKodu.trim() : "",
    testPlanKodu: typeof d.testPlanKodu === "string" ? d.testPlanKodu.trim() : "",
    fiyat: sayi(d.fiyat, 0),
    // Üst sınır: ek süre bir "ücretsiz ay"a dönüşmesin.
    ekSureGun: Math.min(sayi(d.ekSureGun, VARSAYILAN_AYAR.ekSureGun), 14),
  };
}

/**
 * Abonelik bu kişiye görünür mü?
 *
 * Test modunda ya da kapalıyken yalnızca yöneticiye: canlı sitede, katılımcılar
 * hiçbir şey görmeden uçtan uca denenebiliyor.
 */
export function abonelikGorunurMu(ayar: AbonelikAyari, yonetici: boolean): boolean {
  if (yonetici) return true;
  return ayar.acik && !ayar.testModu;
}

const GUN_MS = 24 * 60 * 60 * 1000;

export type AbonelikOzeti = {
  durum: AbonelikDurumKodu;
  /** İzlemenin açık olduğu son an; hiç başarılı çekim yoksa null. */
  erisimBitis: Date | null;
  donemBaslangic: Date | null;
  donemBitis: Date | null;
  tutar: number | null;
  /** Başarılı çekimlerin kodları, eskiden yeniye. */
  basariliSiparisler: string[];
  /** En son çekim reddedildiyse o çekim. */
  sonRet: { kod: string; hata: string | null } | null;
};

function durumCevir(durum: AbonelikDurumu | undefined, basariVar: boolean): AbonelikDurumKodu {
  switch (durum) {
    case "ACTIVE":
      return basariVar ? "aktif" : "bekliyor";
    case "UNPAID":
      return "odeme_alinamadi";
    case "CANCELED":
      return "iptal";
    case "EXPIRED":
    case "UPGRADED":
      return "sona_erdi";
    case "PENDING":
    default:
      return basariVar ? "aktif" : "bekliyor";
  }
}

/**
 * iyzico'nun abonelik detayından erişim kararı.
 *
 * Kurallar:
 *   - İzleme, son BAŞARILI çekimin dönem sonuna kadar açık.
 *   - Abonelik sürüyorsa (aktif ya da yenilemesi reddedilmiş) üstüne ek süre:
 *     yenileme çekimi dönem sonunda yapılıyor ve kart reddedilirse kişinin
 *     kartını güncellemesine vakit kalmalı.
 *   - İptal edilmiş ya da süresi bitmiş abonelikte ek süre YOK: ödenen
 *     dönemin sonu, erişimin sonu.
 */
export function abonelikOzeti(detay: AbonelikDetayi, ekSureGun: number): AbonelikOzeti {
  const siparisler = [...(detay.orders ?? [])].sort((a, b) => (a.startPeriod ?? 0) - (b.startPeriod ?? 0));
  const basarili = siparisler.filter((s) => s.orderStatus === "SUCCESS" && s.endPeriod);
  const sonBasarili = basarili.at(-1) ?? null;
  const sonSiparis = siparisler.at(-1) ?? null;

  let durum = durumCevir(detay.subscriptionStatus, basarili.length > 0);
  // iyzico durumu bazen bir süre ACTIVE bırakıyor; son çekim reddedildiyse
  // kişiye "ödemen alınamadı" demek gerekiyor.
  if (durum === "aktif" && sonSiparis?.orderStatus === "FAILED") durum = "odeme_alinamadi";

  const donemBitis = sonBasarili?.endPeriod ? new Date(sonBasarili.endPeriod) : null;
  const surdurulen = durum === "aktif" || durum === "odeme_alinamadi";
  const erisimBitis = donemBitis
    ? new Date(donemBitis.getTime() + (surdurulen ? ekSureGun * GUN_MS : 0))
    : null;

  const sonDeneme = sonSiparis?.paymentAttempts?.at(-1);
  return {
    durum,
    erisimBitis,
    donemBaslangic: sonBasarili?.startPeriod ? new Date(sonBasarili.startPeriod) : null,
    donemBitis,
    tutar: sonBasarili?.price ?? sonSiparis?.price ?? null,
    basariliSiparisler: basarili.map((s) => s.referenceCode),
    sonRet:
      sonSiparis?.orderStatus === "FAILED"
        ? { kod: sonSiparis.referenceCode, hata: sonDeneme?.errorMessage ?? null }
        : null,
  };
}

/** Kişi şu an izleyebiliyor mu? */
export function erisimAcikMi(erisimBitis: string | Date | null | undefined, simdi = new Date()): boolean {
  if (!erisimBitis) return false;
  const t = new Date(erisimBitis).getTime();
  return Number.isFinite(t) && t > simdi.getTime();
}

/**
 * Profildeki telefonu iyzico'nun beklediği biçime çevirir: +905xxxxxxxxx.
 *
 * iyzico müşteriyi e-posta ve telefonla tanıyor; boş ya da biçimsiz numara
 * formu hiç açtırmıyor. Çözülemeyen numarada yer tutucu dönüyor, tek
 * seferlik ödemedeki gibi.
 */
export function telefonE164(ham: string | null | undefined): string {
  const rakam = (ham ?? "").replace(/\D/g, "");
  if (/^90\d{10}$/.test(rakam)) return `+${rakam}`;
  if (/^0\d{10}$/.test(rakam)) return `+9${rakam}`;
  if (/^5\d{9}$/.test(rakam)) return `+90${rakam}`;
  return "+905000000000";
}

/**
 * iyzico abonelik bildiriminin imzası (X-IYZ-SIGNATURE-V3).
 *
 * Sıra iyzico'nun dokümanındaki gibi: merchantId + secretKey + eventType +
 * subscriptionReferenceCode + orderReferenceCode + customerReferenceCode,
 * anahtar secretKey, HMAC-SHA256, onaltılık.
 *
 * İmza bir EK kilit: bildirimin gövdesine zaten güvenmiyoruz, her bildirimde
 * aboneliği iyzico'ya tekrar soruyoruz. Sahte bir bildirim en fazla bir
 * sorguyu tetikler.
 */
export function bildirimImzasi(girdi: {
  merchantId: string;
  secretKey: string;
  olay: string;
  abonelikKodu: string;
  siparisKodu: string;
  musteriKodu: string;
}): string {
  const metin =
    girdi.merchantId + girdi.secretKey + girdi.olay + girdi.abonelikKodu + girdi.siparisKodu + girdi.musteriKodu;
  return createHmac("sha256", girdi.secretKey).update(metin, "utf8").digest("hex");
}

export function imzaDogruMu(beklenen: string, gelen: string): boolean {
  const a = Buffer.from(beklenen.toLowerCase());
  const b = Buffer.from(gelen.trim().toLowerCase());
  // Uzunluk farkı timingSafeEqual'ı hata fırlattığı için önce ayıklanıyor.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type AbonelikGorunumu = {
  id: string;
  durum: AbonelikDurumKodu;
  kaynak: "iyzico" | "yonetici";
  erisimAcik: boolean;
  erisimBitis: string | null;
  donemBitis: string | null;
  tutar: number | null;
  testModu: boolean;
  /** iyzico'da iptal edilebilir ya da kartı güncellenebilir durumda mı. */
  surduruluyor: boolean;
  sonHata: string | null;
};

/**
 * Kişinin panelde gösterilecek aboneliği.
 *
 * Birden fazla satır olabiliyor (iptal edip yeniden abone olan, yönetimden
 * süre tanınan). Öncelik: erişimi açık olanlar içinde en geç biteni; hiçbiri
 * açık değilse en son açılan.
 */
export function aboneligiSec(
  satirlar: Satir<"abonelikler">[],
  simdi = new Date(),
): AbonelikGorunumu | null {
  const anlamli = satirlar.filter((s) => s.durum !== "bekliyor" && s.durum !== "basarisiz");
  if (anlamli.length === 0) return null;

  const acik = anlamli
    .filter((s) => erisimAcikMi(s.erisim_bitis, simdi))
    .sort((a, b) => new Date(b.erisim_bitis!).getTime() - new Date(a.erisim_bitis!).getTime());
  const secilen =
    acik[0] ?? [...anlamli].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return {
    id: secilen.id,
    durum: secilen.durum,
    kaynak: secilen.kaynak === "yonetici" ? "yonetici" : "iyzico",
    erisimAcik: erisimAcikMi(secilen.erisim_bitis, simdi),
    erisimBitis: secilen.erisim_bitis,
    donemBitis: secilen.donem_bitis,
    tutar: secilen.tutar != null ? Number(secilen.tutar) : null,
    testModu: secilen.test_modu,
    surduruluyor:
      secilen.kaynak === "iyzico" &&
      Boolean(secilen.iyzico_abonelik_kodu) &&
      (secilen.durum === "aktif" || secilen.durum === "odeme_alinamadi"),
    sonHata: secilen.son_hata,
  };
}

export const DURUM_ETIKETI: Record<AbonelikDurumKodu, string> = {
  bekliyor: "Ödeme bekleniyor",
  aktif: "Aktif",
  odeme_alinamadi: "Ödeme alınamadı",
  iptal: "İptal edildi",
  sona_erdi: "Sona erdi",
  basarisiz: "Başlatılamadı",
};
