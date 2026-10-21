import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { request as httpsIstegi } from "node:https";

/**
 * iyzico istemcisi — bağımlılıksız.
 *
 * `iyzipay` paketi kurulmadı: yaptığı iş iki uç noktaya imzalı JSON POST'lamak
 * ve paket hâlâ callback tabanlı bir API sunuyor. Aynı şey node:crypto ile
 * otuz satır; buna karşılık güncellenmeyen bir bağımlılığı ödeme yolunda
 * taşımıyoruz.
 *
 * Kullanılan ürün Checkout Form: kart alanları iyzico'nun kendi sayfasında,
 * 3D Secure de orada. Kart verisi bu sunucuya hiç uğramıyor.
 */

const SANDBOX_TABAN = "https://sandbox-api.iyzipay.com";
const CANLI_TABAN = "https://api.iyzipay.com";

const YOL_BASLAT = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
const YOL_SORGULA = "/payment/iyzipos/checkoutform/auth/ecom/detail";

export type IyzicoAyar = {
  apiKey: string;
  secretKey: string;
  taban: string;
  canli: boolean;
};

/**
 * Anahtarlar ortam değişkeninde, settings tablosunda değil.
 *
 * Tabloya koymak, panele erişen herkesin (ve tabloyu okuyabilen her hatanın)
 * canlı tahsilat anahtarına ulaşması demek. Sır olan tek şey burada tutuluyor.
 */
export function iyzicoAyari(): IyzicoAyar | null {
  const apiKey = process.env.IYZICO_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim();
  if (!apiKey || !secretKey) return null;

  // Varsayılan sandbox: yanlış yapılandırmada gerçek para çekilmesindense
  // ödeme hiç çalışmasın.
  const canli = (process.env.IYZICO_ORTAM ?? "sandbox").trim().toLowerCase() === "canli";
  return { apiKey, secretKey, taban: canli ? CANLI_TABAN : SANDBOX_TABAN, canli };
}

/**
 * IYZWSv2 yetkilendirme başlığı.
 *
 * İmza, GÖNDERİLEN gövde metninin birebir kendisi üzerinden alınıyor. Nesneyi
 * ikinci kez JSON'a çevirirsek (alan sırası değişirse) imza tutmaz; bu yüzden
 * aşağıda gövde bir kez üretilip hem imzaya hem isteğe veriliyor.
 */
function yetkiBasligi(ayar: IyzicoAyar, yol: string, govde: string) {
  const rastgele = randomUUID().replace(/-/g, "");
  const imza = createHmac("sha256", ayar.secretKey)
    .update(rastgele + yol + govde, "utf8")
    .digest("hex");
  const parametreler = `apiKey:${ayar.apiKey}&randomKey:${rastgele}&signature:${imza}`;
  return {
    rastgele,
    baslik: `IYZWSv2 ${Buffer.from(parametreler, "utf8").toString("base64")}`,
  };
}

async function istek<T>(ayar: IyzicoAyar, yol: string, veri: unknown): Promise<T> {
  return iyzicoCagir<T>(ayar, "POST", yol, veri);
}

/**
 * Herhangi bir iyzico ucuna imzalı istek.
 *
 * GET'te de imza "{}" gövdesi üzerinden alınıyor ve istek bu gövdeyle
 * gidiyor: iyzico'nun resmî Node istemcisi (iyzipay 2.0.70, IyzipayResource)
 * gövdesiz uçlarda boş nesneyi hem imzalıyor hem gönderiyor. Boş metinle
 * imzalamak, sunucunun beklediğinden farklı bir imza demek.
 *
 * fetch GET isteğinde gövdeye izin vermediği için GET'ler node:https ile
 * gidiyor. İmza yolu sorgu dizesini kapsamıyor; buradaki GET'lerin hepsi
 * parametreyi yolun içinde taşıyor.
 */
export async function iyzicoCagir<T>(
  ayar: IyzicoAyar,
  yontem: "GET" | "POST",
  yol: string,
  veri?: unknown,
): Promise<T> {
  const govde = JSON.stringify(veri ?? {});
  const { rastgele, baslik } = yetkiBasligi(ayar, yol.split("?")[0], govde);
  const basliklar = {
    "Content-Type": "application/json",
    Authorization: baslik,
    "x-iyzi-rnd": rastgele,
  };

  let durum: number;
  let metin: string;
  if (yontem === "POST") {
    const cevap = await fetch(ayar.taban + yol, { method: "POST", headers: basliklar, body: govde, cache: "no-store" });
    durum = cevap.status;
    metin = await cevap.text();
  } else {
    ({ durum, metin } = await govdeliGet(ayar.taban + yol, basliklar, govde));
  }

  try {
    return JSON.parse(metin) as T;
  } catch {
    // iyzico hata durumunda da JSON döndürüyor; buraya düşmek ağ katmanında
    // bir sorun (proxy hata sayfası, kesilmiş cevap) demek.
    throw new Error(`iyzico beklenmedik cevap verdi (HTTP ${durum}): ${metin.slice(0, 200)}`);
  }
}

function govdeliGet(
  adres: string,
  basliklar: Record<string, string>,
  govde: string,
): Promise<{ durum: number; metin: string }> {
  return new Promise((coz, reddet) => {
    const istek = httpsIstegi(
      adres,
      {
        method: "GET",
        headers: { ...basliklar, "Content-Length": Buffer.byteLength(govde).toString() },
        timeout: 20_000,
      },
      (cevap) => {
        const parcalar: Buffer[] = [];
        cevap.on("data", (p: Buffer) => parcalar.push(p));
        cevap.on("end", () => coz({ durum: cevap.statusCode ?? 0, metin: Buffer.concat(parcalar).toString("utf8") }));
        cevap.on("error", reddet);
      },
    );
    istek.on("timeout", () => istek.destroy(new Error("iyzico isteği zaman aşımına uğradı.")));
    istek.on("error", reddet);
    istek.end(govde);
  });
}

/**
 * Test ortamı anahtarları — yalnızca aboneliğin test modu için.
 *
 * Canlı sitede gerçek ödemeler IYZICO_* anahtarlarıyla alınırken aboneliği
 * uçtan uca denemek için ayrı bir sandbox anahtarı gerekiyor; ortamı topluca
 * sandbox'a çevirmek tek seferlik ödemeleri de durdururdu. Tanımlı değilse ve
 * ana ortam zaten sandbox ise ana anahtarlar kullanılıyor.
 */
export function iyzicoTestAyari(): IyzicoAyar | null {
  const apiKey = process.env.IYZICO_SANDBOX_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SANDBOX_SECRET_KEY?.trim();
  if (apiKey && secretKey) return { apiKey, secretKey, taban: SANDBOX_TABAN, canli: false };

  const ana = iyzicoAyari();
  return ana && !ana.canli ? ana : null;
}

/* ------------------------------------------------------------- tipler --- */

type IyzicoOrtak = {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  conversationId?: string;
  locale?: string;
};

export type BaslatmaCevabi = IyzicoOrtak & {
  token?: string;
  /** Öğrencinin yönlendirileceği iyzico ödeme sayfası. */
  paymentPageUrl?: string;
  tokenExpireTime?: number;
};

export type SorgulamaCevabi = IyzicoOrtak & {
  paymentStatus?: string;
  paymentId?: string;
  price?: number;
  paidPrice?: number;
  installment?: number;
  currency?: string;
  basketId?: string;
  lastFourDigits?: string;
  cardFamily?: string;
  cardAssociation?: string;
  /** 1 onaylı, 0 incelemede, -1 reddedildi. */
  fraudStatus?: number;
};

export type Alici = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon: string;
  ip: string;
};

export type SepetKalemi = {
  id: string;
  ad: string;
  kategori: string;
};

export type Adres = {
  adres: string;
  sehir: string;
  ulke: string;
};

/**
 * iyzico tutarları ondalık metin bekliyor ve sepet kalemlerinin toplamı
 * `price` ile birebir tutmak zorunda. Sayı olarak gönderilirse 1000.1 gibi
 * değerlerde kayan nokta artığı imzayı değil ama doğrulamayı bozuyor.
 */
export function tutarMetni(tutar: number): string {
  return tutar.toFixed(2);
}

/** "1 / 3 / 6 / 9" gibi serbest metinden taksit listesi. */
export function taksitleriCoz(ham: string | undefined | null): number[] {
  const sayilar = (ham ?? "")
    .split(/[^0-9]+/)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  const benzersiz = [...new Set(sayilar)].sort((a, b) => a - b);
  // Tek çekim her zaman açık kalmalı; listeden düşerse kart sahibi taksit
  // seçmek zorunda kalıyor.
  if (!benzersiz.includes(1)) benzersiz.unshift(1);
  return benzersiz.length > 0 ? benzersiz : [1];
}

/* ---------------------------------------------------------- uç noktalar --- */

export async function odemeBaslat(
  ayar: IyzicoAyar,
  girdi: {
    konusmaId: string;
    tutar: number;
    donusAdresi: string;
    alici: Alici;
    kalem: SepetKalemi;
    adres: Adres;
    taksitler: number[];
  },
): Promise<BaslatmaCevabi> {
  const fiyat = tutarMetni(girdi.tutar);
  const adres = {
    contactName: `${girdi.alici.ad} ${girdi.alici.soyad}`.trim() || girdi.alici.email,
    city: girdi.adres.sehir,
    country: girdi.adres.ulke,
    address: girdi.adres.adres,
  };

  return istek<BaslatmaCevabi>(ayar, YOL_BASLAT, {
    locale: "tr",
    conversationId: girdi.konusmaId,
    price: fiyat,
    paidPrice: fiyat,
    currency: "TRY",
    basketId: girdi.konusmaId,
    paymentGroup: "PRODUCT",
    callbackUrl: girdi.donusAdresi,
    enabledInstallments: girdi.taksitler,
    buyer: {
      id: girdi.alici.id,
      name: girdi.alici.ad,
      surname: girdi.alici.soyad,
      gsmNumber: girdi.alici.telefon,
      email: girdi.alici.email,
      // Zorunlu alan. Eğitim satışında kimlik numarası toplamıyoruz; iyzico'nun
      // kendi dokümanındaki yer tutucu değer kullanılıyor.
      identityNumber: "11111111111",
      registrationAddress: girdi.adres.adres,
      ip: girdi.alici.ip,
      city: girdi.adres.sehir,
      country: girdi.adres.ulke,
    },
    shippingAddress: adres,
    billingAddress: adres,
    basketItems: [
      {
        id: girdi.kalem.id,
        name: girdi.kalem.ad,
        category1: girdi.kalem.kategori,
        // Fiziksel teslimat yok; kargo/teslimat akışını da kapatıyor.
        itemType: "VIRTUAL",
        price: fiyat,
      },
    ],
  });
}

export async function odemeSorgula(ayar: IyzicoAyar, token: string): Promise<SorgulamaCevabi> {
  return istek<SorgulamaCevabi>(ayar, YOL_SORGULA, { locale: "tr", token });
}

/** Ödeme gerçekten başarılı mı? İki alan da doğru olmadan "ödendi" yazmıyoruz. */
export function basariliMi(cevap: SorgulamaCevabi): boolean {
  return cevap.status === "success" && cevap.paymentStatus === "SUCCESS";
}
