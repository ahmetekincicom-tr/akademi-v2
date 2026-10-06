import { describe, it, expect } from "vitest";
import { kartBasligiSatirlari } from "@/lib/baslik-satiri";

describe("kartBasligiSatirlari", () => {
  it("kısa başlıkta 'Birebir'i program adıyla birlikte üstte tutar", () => {
    expect(kartBasligiSatirlari("Birebir Meta Business Eğitimi", "Meta Business")).toEqual({
      ilk: "Birebir Meta Business",
      kalan: "Eğitimi",
    });
    expect(kartBasligiSatirlari("Birebir Meta Ads Eğitimi", "Meta Ads")).toEqual({
      ilk: "Birebir Meta Ads",
      kalan: "Eğitimi",
    });
    expect(kartBasligiSatirlari("Birebir Yapay Zekâ Eğitimi", "Yapay zekâ")).toEqual({
      ilk: "Birebir Yapay Zekâ",
      kalan: "Eğitimi",
    });
  });

  /*
    Asıl sebep bu: uzun başlıkta ilk kelimeyi tek başına bırakmak "Birebir" ile
    30 karakterlik bir satır üretiyordu, denge yok.
  */
  it("uzun başlıkta satırları dengeler", () => {
    expect(kartBasligiSatirlari("Birebir Sosyal Medya & Reklam Eğitimi", "Sosyal medya")).toEqual({
      ilk: "Birebir Sosyal Medya",
      kalan: "& Reklam Eğitimi",
    });
    expect(kartBasligiSatirlari("Birebir Sosyal Medya Uzmanlığı Eğitimi", "Sosyal medya")).toEqual({
      ilk: "Birebir Sosyal Medya",
      kalan: "Uzmanlığı Eğitimi",
    });
  });

  it("program adını ortadan bölmez", () => {
    const s = kartBasligiSatirlari("Birebir Meta Ads Eğitimi", "Meta Ads");
    expect(s?.ilk.endsWith("Meta")).toBe(false);
    expect(s?.kalan.startsWith("Ads")).toBe(false);
  });

  it("etiket başlıkta geçmiyorsa kelime kelime böler", () => {
    expect(kartBasligiSatirlari("Kurumsal Dijital Pazarlama Eğitimi", "Kurumsal")).toEqual({
      ilk: "Kurumsal Dijital",
      kalan: "Pazarlama Eğitimi",
    });
  });

  it("tek kelimelik başlık bölünmez", () => {
    expect(kartBasligiSatirlari("Eğitim", "Genel")).toBeNull();
  });

  it("etiketi başlıkta büyük/küçük harf farkıyla da bulur", () => {
    expect(kartBasligiSatirlari("Birebir Sosyal Medya Eğitimi", "sosyal MEDYA")).toEqual({
      ilk: "Birebir Sosyal Medya",
      kalan: "Eğitimi",
    });
  });
});
