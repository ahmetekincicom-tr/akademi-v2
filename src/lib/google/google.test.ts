import { describe, it, expect } from "vitest";
import { gaClientId, gclidCoz } from "@/lib/google/gcl";
import { createHash } from "node:crypto";
import { mpGovdesi } from "@/lib/google/mp";
import { googleEposta, googleKullaniciVerisi, googleTelefon } from "@/lib/google/kimlik";

describe("gaClientId (_ga çerezi)", () => {
  it("client_id'yi çıkarır", () => {
    expect(gaClientId("GA1.1.1234567890.1700000000")).toBe("1234567890.1700000000");
    expect(gaClientId("GA1.2.987654321.1699999999")).toBe("987654321.1699999999");
  });
  it("biçim tutmuyorsa null", () => {
    expect(gaClientId(null)).toBeNull();
    expect(gaClientId("")).toBeNull();
    expect(gaClientId("GA1.1.abc")).toBeNull();
    expect(gaClientId("cöp")).toBeNull();
  });
});

describe("gclidCoz (_gcl_aw çerezi)", () => {
  it("gclid'i çıkarır", () => {
    expect(gclidCoz("GCL.1700000000.CjwKCAjw_gclid_ornek123")).toBe("CjwKCAjw_gclid_ornek123");
  });
  it("biçim tutmuyorsa null", () => {
    expect(gclidCoz(null)).toBeNull();
    expect(gclidCoz("GCL.1700000000.")).toBeNull();
    expect(gclidCoz("başka")).toBeNull();
  });
});

describe("mpGovdesi (GA4 Measurement Protocol)", () => {
  const govde = mpGovdesi({
    clientId: "111.222",
    tutar: 4500,
    paymentId: "pay-123",
    kursAdi: "Meta Ads Eğitimi",
    gclid: "GCLID_ABC",
    izin: true,
    zamanMs: 1_700_000_000_000,
  }) as {
    client_id: string;
    timestamp_micros: number;
    consent: { ad_user_data: string; ad_personalization: string };
    events: { name: string; params: Record<string, unknown> }[];
  };

  it("client_id ve purchase olayı doğru", () => {
    expect(govde.client_id).toBe("111.222");
    expect(govde.events[0].name).toBe("purchase");
    expect(govde.events[0].params.value).toBe(4500);
    expect(govde.events[0].params.currency).toBe("TRY");
    // transaction_id = ödeme kimliği → GA4 dedup
    expect(govde.events[0].params.transaction_id).toBe("pay-123");
    expect(govde.events[0].params.gclid).toBe("GCLID_ABC");
  });

  it("timestamp_micros ms×1000", () => {
    expect(govde.timestamp_micros).toBe(1_700_000_000_000 * 1000);
  });

  it("izin consent'e yansıyor", () => {
    expect(govde.consent.ad_user_data).toBe("GRANTED");
    const redli = mpGovdesi({
      clientId: "1.2", tutar: 1, paymentId: "p", kursAdi: "x", gclid: null, izin: false,
    }) as { consent: { ad_user_data: string }; events: { params: Record<string, unknown> }[] };
    expect(redli.consent.ad_user_data).toBe("DENIED");
    // gclid yoksa parametreye eklenmiyor
    expect("gclid" in redli.events[0].params).toBe(false);
  });
});

describe("GA4 kullanıcı verisi (lib/google/kimlik)", () => {
  const sha = (d: string) => createHash("sha256").update(d, "utf8").digest("hex");

  it("e-posta: boşluk atılır, küçük harf; gmail'de @'ten önceki noktalar atılır", () => {
    expect(googleEposta("  Ahmet.Ekinci@Gmail.com ")).toBe("ahmetekinci@gmail.com");
    expect(googleEposta("a.b.c@googlemail.com")).toBe("abc@googlemail.com");
    // Başka alan adlarında nokta anlamlı: dokunulmaz.
    expect(googleEposta("Ad.Soyad@Firma.com.tr")).toBe("ad.soyad@firma.com.tr");
    expect(googleEposta("gecersiz")).toBeNull();
    expect(googleEposta("@gmail.com")).toBeNull();
    expect(googleEposta(null)).toBeNull();
  });

  it("telefon: E.164, başında + (Türkiye biçimleri)", () => {
    expect(googleTelefon("0532 123 45 67")).toBe("+905321234567");
    expect(googleTelefon("+90 (532) 123-45-67")).toBe("+905321234567");
    expect(googleTelefon("5321234567")).toBe("+905321234567");
    expect(googleTelefon("0090 532 123 45 67")).toBe("+905321234567");
    expect(googleTelefon("12")).toBeNull();
    expect(googleTelefon("")).toBeNull();
  });

  it("hash'ler normalleştirilmiş değerin SHA-256 hex'i; boşsa null", () => {
    expect(googleKullaniciVerisi({ eposta: "A.B@gmail.com", telefon: "05321234567" })).toEqual({
      sha256_email_address: [sha("ab@gmail.com")],
      sha256_phone_number: [sha("+905321234567")],
    });
    expect(googleKullaniciVerisi({ eposta: "ab@x.com" })).toEqual({ sha256_email_address: [sha("ab@x.com")] });
    expect(googleKullaniciVerisi({ eposta: "", telefon: null })).toBeNull();
  });

  it("user_id + user_data yalnız reklam izni varsa gövdeye girer", () => {
    const veri = googleKullaniciVerisi({ eposta: "ab@x.com" });
    const ortak = { clientId: "1.2", tutar: 1, paymentId: "p", kursAdi: "x", gclid: null, userId: "uuid-1", kullaniciVerisi: veri };
    const izinli = mpGovdesi({ ...ortak, izin: true }) as Record<string, unknown>;
    expect(izinli.user_id).toBe("uuid-1");
    expect(izinli.user_data).toEqual(veri);
    const izinsiz = mpGovdesi({ ...ortak, izin: false }) as Record<string, unknown>;
    expect("user_id" in izinsiz).toBe(false);
    expect("user_data" in izinsiz).toBe(false);
    // Eşleştirilecek veri yoksa user_id de gönderilmez.
    const bos = mpGovdesi({ ...ortak, izin: true, kullaniciVerisi: null }) as Record<string, unknown>;
    expect("user_id" in bos).toBe(false);
  });
});
