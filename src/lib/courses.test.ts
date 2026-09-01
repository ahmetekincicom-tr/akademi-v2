import { describe, expect, it } from "vitest";
import { basligiIkiSatir } from "@/lib/courses";



describe("basligiIkiSatir", () => {
  it("ilk kelimeyi kendi satırına alır", () => {
    expect(basligiIkiSatir("Birebir Meta Ads Eğitimi")).toEqual({
      ilk: "Birebir",
      kalan: "Meta Ads Eğitimi",
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
