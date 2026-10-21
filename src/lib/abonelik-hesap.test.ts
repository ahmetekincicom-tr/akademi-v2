import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  abonelikAyariniCoz,
  abonelikGorunurMu,
  abonelikOzeti,
  aboneligiSec,
  bildirimImzasi,
  erisimAcikMi,
  imzaDogruMu,
  telefonE164,
} from "@/lib/abonelik-hesap";
import type { AbonelikDetayi } from "@/lib/iyzico-abonelik";
import type { Satir } from "@/lib/supabase/tipler";

const GUN = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 1); // 1 Ekim 2026
const ay = (n: number) => T0 + n * 30 * GUN;

function detay(durum: AbonelikDetayi["subscriptionStatus"], siparisler: AbonelikDetayi["orders"]): AbonelikDetayi {
  return { referenceCode: "SUB-1", subscriptionStatus: durum, orders: siparisler };
}

const basarili = (n: number, kod = `ORD-${n}`) => ({
  referenceCode: kod,
  price: 499,
  startPeriod: ay(n),
  endPeriod: ay(n + 1),
  orderStatus: "SUCCESS" as const,
});

describe("abonelikOzeti — erişim kuralı", () => {
  it("aktif abonelikte erişim son başarılı dönemin sonu + ek süre", () => {
    const o = abonelikOzeti(detay("ACTIVE", [basarili(0), basarili(1)]), 3);
    expect(o.durum).toBe("aktif");
    expect(o.donemBitis?.getTime()).toBe(ay(2));
    expect(o.erisimBitis?.getTime()).toBe(ay(2) + 3 * GUN);
    expect(o.tutar).toBe(499);
    expect(o.basariliSiparisler).toEqual(["ORD-0", "ORD-1"]);
  });

  /*
    İptal edilen abonelikte ek süre YOK: kişi ödediği dönemin sonuna kadar
    izliyor, bir gün fazla değil. Ek süre yalnızca "yenileme reddedildi, kartını
    güncelle" durumunun tamponu.
  */
  it("iptal edilende erişim ödenmiş dönemin sonunda biter", () => {
    const o = abonelikOzeti(detay("CANCELED", [basarili(0)]), 3);
    expect(o.durum).toBe("iptal");
    expect(o.erisimBitis?.getTime()).toBe(ay(1));
  });

  it("süresi dolanda ek süre yok", () => {
    const o = abonelikOzeti(detay("EXPIRED", [basarili(0)]), 3);
    expect(o.durum).toBe("sona_erdi");
    expect(o.erisimBitis?.getTime()).toBe(ay(1));
  });

  it("reddedilen yenilemede erişim ek süreyle devam eder ve ret bilgisi döner", () => {
    const ret = {
      referenceCode: "ORD-1",
      price: 499,
      startPeriod: ay(1),
      endPeriod: ay(2),
      orderStatus: "FAILED" as const,
      paymentAttempts: [{ paymentStatus: "FAILED" as const, errorMessage: "Yetersiz bakiye" }],
    };
    const o = abonelikOzeti(detay("UNPAID", [basarili(0), ret]), 3);
    expect(o.durum).toBe("odeme_alinamadi");
    expect(o.erisimBitis?.getTime()).toBe(ay(1) + 3 * GUN);
    expect(o.sonRet).toEqual({ kod: "ORD-1", hata: "Yetersiz bakiye" });
  });

  it("iyzico ACTIVE dese de son çekim reddedildiyse ödeme alınamadı sayılır", () => {
    const ret = { referenceCode: "ORD-1", startPeriod: ay(1), endPeriod: ay(2), orderStatus: "FAILED" as const };
    expect(abonelikOzeti(detay("ACTIVE", [basarili(0), ret]), 3).durum).toBe("odeme_alinamadi");
  });

  it("hiç başarılı çekim yoksa erişim yok", () => {
    const o = abonelikOzeti(detay("ACTIVE", [{ referenceCode: "ORD-0", orderStatus: "WAITING" }]), 3);
    expect(o.durum).toBe("bekliyor");
    expect(o.erisimBitis).toBeNull();
  });

  it("siparişlerin sırası iyzico'nun döndürdüğü sıraya bağlı değil", () => {
    const o = abonelikOzeti(detay("ACTIVE", [basarili(2), basarili(0), basarili(1)]), 0);
    expect(o.donemBitis?.getTime()).toBe(ay(3));
    expect(o.basariliSiparisler).toEqual(["ORD-0", "ORD-1", "ORD-2"]);
  });
});

describe("abonelikAyariniCoz", () => {
  it("boş ya da bozuk ayar güvenli varsayılana düşer: kapalı ve test modunda", () => {
    expect(abonelikAyariniCoz(null)).toMatchObject({ acik: false, testModu: true, ekSureGun: 3 });
    expect(abonelikAyariniCoz({ acik: "evet", fiyat: "abc" })).toMatchObject({ acik: false, fiyat: 0 });
  });

  it("test modu yalnızca açıkça false yazılınca kapanır", () => {
    expect(abonelikAyariniCoz({ testModu: false }).testModu).toBe(false);
    expect(abonelikAyariniCoz({ testModu: "false" }).testModu).toBe(true);
  });

  it("ek süre 14 günle sınırlı", () => {
    expect(abonelikAyariniCoz({ ekSureGun: 90 }).ekSureGun).toBe(14);
  });
});

describe("abonelikGorunurMu", () => {
  const ayar = abonelikAyariniCoz({});
  it("yönetici her durumda görür", () => {
    expect(abonelikGorunurMu(ayar, true)).toBe(true);
  });
  it("katılımcı yalnızca açık ve test dışıyken görür", () => {
    expect(abonelikGorunurMu({ ...ayar, acik: true, testModu: true }, false)).toBe(false);
    expect(abonelikGorunurMu({ ...ayar, acik: false, testModu: false }, false)).toBe(false);
    expect(abonelikGorunurMu({ ...ayar, acik: true, testModu: false }, false)).toBe(true);
  });
});

describe("telefonE164", () => {
  it("Türkiye numaralarının yaygın yazımlarını çevirir", () => {
    expect(telefonE164("0532 123 45 67")).toBe("+905321234567");
    expect(telefonE164("+90 (532) 123-45-67")).toBe("+905321234567");
    expect(telefonE164("5321234567")).toBe("+905321234567");
  });
  it("çözülemeyende yer tutucu döner", () => {
    expect(telefonE164("")).toBe("+905000000000");
    expect(telefonE164("123")).toBe("+905000000000");
  });
});

describe("bildirim imzası", () => {
  const girdi = {
    merchantId: "123",
    secretKey: "gizli",
    olay: "subscription.order.success",
    abonelikKodu: "SUB",
    siparisKodu: "ORD",
    musteriKodu: "CUS",
  };

  it("iyzico'nun dokümanındaki sırayla hesaplanır", () => {
    const beklenen = createHmac("sha256", "gizli")
      .update("123gizlisubscription.order.successSUBORDCUS")
      .digest("hex");
    expect(bildirimImzasi(girdi)).toBe(beklenen);
  });

  it("karşılaştırma büyük/küçük harfe ve uzunluğa dayanıklı", () => {
    const imza = bildirimImzasi(girdi);
    expect(imzaDogruMu(imza, imza.toUpperCase())).toBe(true);
    expect(imzaDogruMu(imza, imza.slice(0, -1))).toBe(false);
    expect(imzaDogruMu(imza, "")).toBe(false);
  });
});

describe("aboneligiSec", () => {
  const simdi = new Date(ay(1));
  const satir = (o: Partial<Satir<"abonelikler">>): Satir<"abonelikler"> => ({
    id: "x",
    user_id: "u",
    kaynak: "iyzico",
    durum: "aktif",
    erisim_bitis: null,
    donem_baslangic: null,
    donem_bitis: null,
    tutar: 499,
    iyzico_abonelik_kodu: "SUB",
    iyzico_musteri_kodu: "CUS",
    iyzico_plan_kodu: "PLAN",
    conversation_id: null,
    token: null,
    test_modu: false,
    iptal_tarihi: null,
    son_hata: null,
    admin_notu: null,
    ham_yanit: null,
    callback_at: null,
    created_at: new Date(ay(0)).toISOString(),
    updated_at: new Date(ay(0)).toISOString(),
    ...o,
  });

  it("tamamlanmamış formları göz ardı eder", () => {
    expect(aboneligiSec([satir({ durum: "bekliyor" }), satir({ durum: "basarisiz" })], simdi)).toBeNull();
  });

  it("erişimi açık olanlar arasında en geç biteni seçer", () => {
    const secilen = aboneligiSec(
      [
        satir({ id: "eski", erisim_bitis: new Date(ay(1) + GUN).toISOString() }),
        satir({ id: "yeni", kaynak: "yonetici", erisim_bitis: new Date(ay(3)).toISOString() }),
      ],
      simdi,
    );
    expect(secilen?.id).toBe("yeni");
    expect(secilen?.erisimAcik).toBe(true);
    // Elle tanınan süre iyzico'da iptal ya da kart güncelleme yapılabilir değil.
    expect(secilen?.surduruluyor).toBe(false);
  });

  it("hiçbiri açık değilse en son açılanı gösterir", () => {
    const secilen = aboneligiSec(
      [
        satir({ id: "a", durum: "iptal", erisim_bitis: new Date(ay(0)).toISOString(), created_at: new Date(ay(0)).toISOString() }),
        satir({ id: "b", durum: "sona_erdi", erisim_bitis: new Date(ay(0)).toISOString(), created_at: new Date(ay(0) + GUN).toISOString() }),
      ],
      simdi,
    );
    expect(secilen?.id).toBe("b");
    expect(secilen?.erisimAcik).toBe(false);
  });
});

describe("erisimAcikMi", () => {
  it("bitiş anı geçmişse kapalı", () => {
    const simdi = new Date(ay(1));
    expect(erisimAcikMi(new Date(ay(1) + 1), simdi)).toBe(true);
    expect(erisimAcikMi(new Date(ay(1)), simdi)).toBe(false);
    expect(erisimAcikMi(null, simdi)).toBe(false);
  });
});
