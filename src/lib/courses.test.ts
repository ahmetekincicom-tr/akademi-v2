import { describe, expect, it } from "vitest";
import { basligiIkiSatir } from "@/lib/courses";



describe("basligiIkiSatir", () => {
  it("başlığı dengeli iki satıra böler", () => {
    // Eskiden hep ilk kelime ("Birebir") tek başına üstte kalıyordu; artık
    // iki satır uzunlukça olabildiğince eşit bölünüyor.
    expect(basligiIkiSatir("Birebir Meta Ads Eğitimi")).toEqual({
      ilk: "Birebir Meta",
      kalan: "Ads Eğitimi",
    });
    expect(basligiIkiSatir("Birebir Meta Business Eğitimi")).toEqual({
      ilk: "Birebir Meta",
      kalan: "Business Eğitimi",
    });
  });

  // İki kelimelik başlıkta bölmek düzelttiğinden fazlasını bozuyor:
  // "Yapay" / "Zekâ" iki tek kelimelik satır demek.
  it("üç kelimeden azsa bölmez", () => {
    expect(basligiIkiSatir("Yapay Zekâ")).toBeNull();
  });

  // Kalan ilk kelimeden kısaysa ters merdiven çıkıyor: uzun satır üstte,
  // kısa satır altta ve başlık dengesiz duruyor.
  it("kalan ilk kelimeden kısaysa bölmez", () => {
    expect(basligiIkiSatir("Pazarlamada A B")).toBeNull();
  });
});
