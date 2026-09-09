import { describe, expect, it } from "vitest";
import { anlamliMetin, egitimTanitimCumlesi } from "@/lib/courses";

/**
 * Eğitim sayfasında başlığın altındaki cümle.
 *
 * Bu testler yaşanmış üç arızayı koruyor. Üçü de aynı kökten geliyordu:
 * sayfa yalnızca hero_aciklama'yı basıyor, panel ise o alanı hiç
 * yazamıyordu.
 */

describe("anlamliMetin", () => {
  it("yer tutucuları eliyor", () => {
    // Tiktok eğitiminin hero açıklaması veritabanında tek harfti: "d".
    expect(anlamliMetin("d")).toBe(false);
    expect(anlamliMetin("test")).toBe(false);
    expect(anlamliMetin("çok yakında")).toBe(false);
  });

  it("gerçek cümleyi kabul ediyor", () => {
    expect(anlamliMetin("Meta reklamlarını sıfırdan kurun")).toBe(true);
  });

  it("boş ve tanımsız değerlerde patlamıyor", () => {
    expect(anlamliMetin("")).toBe(false);
    expect(anlamliMetin("   ")).toBe(false);
    expect(anlamliMetin(null)).toBe(false);
    expect(anlamliMetin(undefined)).toBe(false);
  });
});

describe("egitimTanitimCumlesi", () => {
  it("hero açıklaması varsa onu kullanıyor", () => {
    expect(
      egitimTanitimCumlesi({ heroAciklama: "Kendi hesabınız üzerinde çalışıyoruz.", aciklama: "Kısa özet burada" }),
    ).toBe("Kendi hesabınız üzerinde çalışıyoruz.");
  });

  it("hero açıklaması BOŞSA kısa açıklamaya düşüyor", () => {
    /*
      Ankara programının durumu buydu: panelde 669 karakterlik bir açıklama
      vardı ama hero_aciklama boş olduğu için sayfada başlığın altı bomboştu.
    */
    expect(egitimTanitimCumlesi({ heroAciklama: "", aciklama: "Sosyal medyada içerik paylaşmak yetmiyor" })).toBe(
      "Sosyal medyada içerik paylaşmak yetmiyor",
    );
  });

  it("yer tutucu hero, gerçek açıklamayı GÖLGELEMİYOR", () => {
    /*
      "d" boş değil, o yüzden basit bir `||` kontrolünde kazanıyordu ve
      ekranda tek harf görünüyordu. Süzgeç onu yok sayıyor.
    */
    expect(egitimTanitimCumlesi({ heroAciklama: "d", aciklama: "TikTok Ads ile reklamları sıfırdan kurun" })).toBe(
      "TikTok Ads ile reklamları sıfırdan kurun",
    );
  });

  it("ikisi de boşsa boş dönüyor", () => {
    // Sayfa bu durumda paragrafı HİÇ basmıyor; boş bir <p> sebepsiz bir
    // boşluk bırakıyordu.
    expect(egitimTanitimCumlesi({ heroAciklama: "", aciklama: "" })).toBe("");
    expect(egitimTanitimCumlesi({ heroAciklama: "d", aciklama: "test" })).toBe("");
  });

  it("baştaki ve sondaki boşlukları kırpıyor", () => {
    expect(egitimTanitimCumlesi({ heroAciklama: "  üç kelimelik cümle  ", aciklama: "" })).toBe(
      "üç kelimelik cümle",
    );
  });
});
