import "server-only";

import { iyzicoCagir, type IyzicoAyar } from "@/lib/iyzico";

/**
 * iyzico abonelik ürünü (v2 uçları).
 *
 * Tek seferlik ödemeden üç farkı var:
 *   - Form bir YÖNLENDİRME adresi değil, sayfaya gömülen bir betik döndürüyor
 *     (checkoutFormContent). Kart alanları yine iyzico'nun çerçevesinde.
 *   - Kartı iyzico saklıyor ve her ay kendisi çekiyor; sonucu bildirimle
 *     (webhook) haber veriyor.
 *   - Abonelik detayı bütün çekim geçmişini (orders) taşıyor. Erişim kararı
 *     oradan hesaplanıyor (lib/abonelik-hesap.ts), bildirimin gövdesinden
 *     değil.
 *
 * Uç listesi: docs.iyzico.com → API Reference (Beta) → Subscription.
 */

type Ortak = {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  systemTime?: number;
  conversationId?: string;
};

export type AbonelikDurumu = "ACTIVE" | "PENDING" | "UNPAID" | "UPGRADED" | "CANCELED" | "EXPIRED";

export type AbonelikSiparisi = {
  referenceCode: string;
  price?: number;
  currencyCode?: string;
  /** Çekimin kapsadığı dönem, epoch ms. */
  startPeriod?: number;
  endPeriod?: number;
  orderStatus?: "WAITING" | "SUCCESS" | "FAILED";
  paymentAttempts?: {
    conversationId?: string;
    createdDate?: number;
    paymentStatus?: "SUCCESS" | "FAILED";
    paymentId?: string;
    errorCode?: string;
    errorMessage?: string;
  }[];
};

export type AbonelikDetayi = {
  referenceCode: string;
  parentReferenceCode?: string;
  pricingPlanName?: string;
  pricingPlanReferenceCode?: string;
  productName?: string;
  customerEmail?: string;
  customerReferenceCode?: string;
  subscriptionStatus?: AbonelikDurumu;
  createdDate?: number;
  startDate?: number;
  endDate?: number;
  orders?: AbonelikSiparisi[];
};

export type FormCevabi = Ortak & {
  token?: string;
  /** Sayfaya gömülecek HTML + betik. */
  checkoutFormContent?: string;
  tokenExpireTime?: number;
};

export type FormSonucu = Ortak & {
  token?: string;
  data?: {
    referenceCode?: string;
    parentReferenceCode?: string;
    customerReferenceCode?: string;
    pricingPlanReferenceCode?: string;
    subscriptionStatus?: AbonelikDurumu;
    startDate?: number;
    endDate?: number;
  };
};

export type DetayCevabi = Ortak & {
  data?: { totalCount?: number; items?: AbonelikDetayi[] };
};

export type PlanCevabi = Ortak & {
  data?: {
    referenceCode?: string;
    name?: string;
    price?: number;
    currencyCode?: string;
    paymentInterval?: string;
    paymentIntervalCount?: number;
    trialPeriodDays?: number;
    productReferenceCode?: string;
    status?: string;
  };
};

export type Abone = {
  ad: string;
  soyad: string;
  email: string;
  /** E.164: +905xxxxxxxxx */
  telefon: string;
  adres: string;
  sehir: string;
};

/** Yol parçası olarak giden referans kodu: kaçışsız bir değer imzayı da bozar. */
function kod(deger: string): string {
  return encodeURIComponent(deger);
}

export async function abonelikFormuBaslat(
  ayar: IyzicoAyar,
  girdi: { konusmaId: string; planKodu: string; donusAdresi: string; abone: Abone },
): Promise<FormCevabi> {
  const adSoyad = `${girdi.abone.ad} ${girdi.abone.soyad}`.trim() || girdi.abone.email;
  const adres = { contactName: adSoyad, city: girdi.abone.sehir, country: "Turkey", address: girdi.abone.adres };

  return iyzicoCagir<FormCevabi>(ayar, "POST", "/v2/subscription/checkoutform/initialize", {
    locale: "tr",
    conversationId: girdi.konusmaId,
    callbackUrl: girdi.donusAdresi,
    pricingPlanReferenceCode: girdi.planKodu,
    // ACTIVE: ilk ay form tamamlanırken çekiliyor. PENDING seçilseydi abonelik
    // ayrıca etkinleştirilene kadar beklerdi; deneme süresi olmadığı için
    // beklemenin bir anlamı yok.
    subscriptionInitialStatus: "ACTIVE",
    customer: {
      name: girdi.abone.ad,
      surname: girdi.abone.soyad,
      email: girdi.abone.email,
      gsmNumber: girdi.abone.telefon,
      // Tek seferlik ödemedeki gerekçe: kimlik numarası toplamıyoruz ve iyzico
      // alanı zorunlu tutuyor; kendi dokümanındaki yer tutucu kullanılıyor.
      identityNumber: "11111111111",
      billingAddress: adres,
      shippingAddress: adres,
    },
  });
}

export async function abonelikFormSonucu(ayar: IyzicoAyar, token: string): Promise<FormSonucu> {
  return iyzicoCagir<FormSonucu>(ayar, "GET", `/v2/subscription/checkoutform/${kod(token)}`);
}

export async function abonelikDetayi(ayar: IyzicoAyar, abonelikKodu: string): Promise<DetayCevabi> {
  return iyzicoCagir<DetayCevabi>(ayar, "GET", `/v2/subscription/subscriptions/${kod(abonelikKodu)}`);
}

export async function abonelikIptalEt(ayar: IyzicoAyar, abonelikKodu: string): Promise<Ortak> {
  // Gövdesiz uç: resmî istemci boş nesne gönderiyor (iyzico.ts → iyzicoCagir).
  return iyzicoCagir<Ortak>(ayar, "POST", `/v2/subscription/subscriptions/${kod(abonelikKodu)}/cancel`);
}

/** Reddedilen bir çekimi kart güncellendikten sonra yeniden dener. */
export async function abonelikOdemesiniYinele(ayar: IyzicoAyar, siparisKodu: string): Promise<Ortak> {
  return iyzicoCagir<Ortak>(ayar, "POST", "/v2/subscription/operation/retry", { referenceCode: siparisKodu });
}

/**
 * Kart güncelleme formu — doğrudan aboneliğin kartını değiştiren uç.
 *
 * Müşteri koduyla çalışan ikinci bir uç da var (.../initialize); o müşterinin
 * BÜTÜN aboneliklerinin kartını değiştiriyor. Burada abonelik koduyla
 * çalışan kullanılıyor (iyzipay 2.0.70, SubscriptionCard.js).
 */
export async function kartGuncellemeFormu(
  ayar: IyzicoAyar,
  girdi: { abonelikKodu: string; donusAdresi: string },
): Promise<FormCevabi> {
  return iyzicoCagir<FormCevabi>(ayar, "POST", "/v2/subscription/card-update/checkoutform/initialize/with-subscription", {
    locale: "tr",
    subscriptionReferenceCode: girdi.abonelikKodu,
    callbackUrl: girdi.donusAdresi,
  });
}

/** Yönetim ekranı: girilen plan kodu gerçekten var mı, fiyatı ne? */
export async function planDetayi(ayar: IyzicoAyar, planKodu: string): Promise<PlanCevabi> {
  return iyzicoCagir<PlanCevabi>(ayar, "GET", `/v2/subscription/pricing-plans/${kod(planKodu)}`);
}
