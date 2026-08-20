import { describe, expect, it, vi } from "vitest";
import { authHatasi, veriHatasi } from "@/lib/auth-hatalari";

/**
 * Hata metinlerinin sözleşmesi tek cümle: HİÇBİR YOLDAN İNGİLİZCE DÖNMEZ.
 *
 * Bu dosyanın asıl işi tek tek çevirileri doğrulamak değil — onlar zaten
 * gözle okunabiliyor. Asıl iş, sözlüğe düşmeyen bir hatanın sessizce
 * ham İngilizce metne dönmediğini garanti etmek. Kapsanmayan durum
 * eklendiğinde bu testler kırılmaz; kırılması gereken şey, birinin
 * `error.message`'ı doğrudan ekrana basmaya geri dönmesi.
 */

/** Latin harfli ama Türkçeye özgü harf içermeyen metin İngilizce olabilir. */
const INGILIZCE_IZI = /^[\x20-\x7E]+$/;

describe("authHatasi", () => {
  it("bilinen kodu Türkçe anlatıyor", () => {
    const metin = authHatasi({ code: "invalid_credentials", message: "Invalid login credentials" });
    expect(metin).toContain("şifre");
    expect(metin).not.toContain("Invalid");
  });

  it("kod yoksa metinden anlıyor", () => {
    // Eski GoTrue sürümleri ve bazı ara katmanlar code alanını doldurmuyor.
    const metin = authHatasi({ message: "Invalid login credentials" });
    expect(metin).toContain("şifre");
  });

  it("aynı kodu bağlama göre farklı anlatıyor", () => {
    const degistir = authHatasi({ code: "otp_expired" }, "sifre-degistir");
    const giris = authHatasi({ code: "otp_expired" }, "giris");
    expect(degistir).toContain("Şifre sıfırlama");
    expect(degistir).not.toBe(giris);
  });

  it("zayıf şifre gerekçesini ayırt ediyor", () => {
    const sizinti = authHatasi({ code: "weak_password", reasons: ["pwned"] }, "kayit");
    const kisa = authHatasi({ code: "weak_password", reasons: ["length"] }, "kayit");
    expect(sizinti).toContain("sızıntı");
    expect(kisa).toContain("8 karakter");
  });

  it("ağ kopmasını sunucu hatası sanmıyor", () => {
    const metin = authHatasi({ message: "Failed to fetch" });
    expect(metin).toContain("bağlantı");
  });

  it("kodsuz 429'u hız sınırı sayıyor", () => {
    expect(authHatasi({ status: 429 })).toContain("Çok fazla deneme");
  });

  it("tanımadığı hatayı Türkçe genele düşürüyor ve konsola yazıyor", () => {
    const konsol = vi.spyOn(console, "error").mockImplementation(() => {});
    const metin = authHatasi({ code: "saml_idp_not_found", message: "SAML IdP not found" });

    expect(metin).not.toContain("SAML");
    expect(INGILIZCE_IZI.test(metin)).toBe(false);
    // Tanılama kaybolmamalı: eşleşmeyen hata bir yere düşmeli.
    expect(konsol).toHaveBeenCalled();
    konsol.mockRestore();
  });

  it("hiçbir girdide İngilizce dönmüyor", () => {
    const konsol = vi.spyOn(console, "error").mockImplementation(() => {});
    const girdiler: unknown[] = [
      null,
      undefined,
      {},
      { code: "" },
      { message: "Something went terribly wrong" },
      { code: "bilinmeyen_kod", message: "Unknown failure" },
      { status: 500 },
      new Error("Unexpected token < in JSON"),
    ];

    for (const girdi of girdiler) {
      expect(INGILIZCE_IZI.test(authHatasi(girdi)), String(JSON.stringify(girdi))).toBe(false);
    }
    konsol.mockRestore();
  });
});

describe("veriHatasi", () => {
  it("kendi RPC metnimizi olduğu gibi geçiriyor", () => {
    // RPC'lerdeki raise exception metinleri zaten Türkçe ve duruma özel.
    const metin = "Bu görüşmeyi iptal etme yetkin yok";
    expect(veriHatasi({ message: metin })).toBe(metin);
  });

  it("Postgres kodunu Türkçeleştiriyor", () => {
    expect(veriHatasi({ code: "42501", message: "permission denied" })).toContain("yetkin yok");
    expect(veriHatasi({ code: "23505", message: "duplicate key" })).toContain("zaten var");
  });

  it("ham PostgREST metnini ekrana basmıyor", () => {
    const konsol = vi.spyOn(console, "error").mockImplementation(() => {});
    const metin = veriHatasi({
      message: 'new row violates row-level security policy for table "payments"',
    });

    expect(metin).not.toContain("row-level security");
    expect(INGILIZCE_IZI.test(metin)).toBe(false);
    konsol.mockRestore();
  });
});
