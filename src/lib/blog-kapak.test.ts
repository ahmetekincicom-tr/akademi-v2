import { describe, expect, it } from "vitest";
import { KAPAK_SIMGELERI, KAPAK_TONLARI, kapakGorunumu, kategoriGorunumu } from "./blog-kapak";

describe("kategoriGorunumu", () => {
  it("onaylanan kategorilerin sabit görünümü var", () => {
    expect(kategoriGorunumu("sosyal-medya")).toEqual({ ton: "mavi", simge: "megaphone" });
    expect(kategoriGorunumu("meta-business-manager")).toEqual({ ton: "lacivert", simge: "target" });
    expect(kategoriGorunumu("yapay-zeka")).toEqual({ ton: "mor", simge: "sparkle" });
  });

  it("tanınmayan kategoride her seferinde aynı, geçerli görünüm", () => {
    const a = kategoriGorunumu("google-ads");
    expect(kategoriGorunumu("google-ads")).toEqual(a);
    expect(KAPAK_TONLARI).toContain(a.ton);
    expect(KAPAK_SIMGELERI).toContain(a.simge);
  });

  it("kategorisiz yazı markanın mavisi", () => {
    expect(kategoriGorunumu(null).ton).toBe("mavi");
  });
});

describe("kapakGorunumu", () => {
  it("geçerli özel seçim kategoriyi ezer, alan alan", () => {
    expect(kapakGorunumu("sosyal-medya", { ton: "mor" })).toEqual({ ton: "mor", simge: "megaphone" });
    expect(kapakGorunumu("sosyal-medya", { simge: "chart" })).toEqual({ ton: "mavi", simge: "chart" });
  });

  it("geçersiz seçim yok sayılır", () => {
    expect(kapakGorunumu("sosyal-medya", { ton: "pembe", simge: "<script>" })).toEqual({
      ton: "mavi",
      simge: "megaphone",
    });
  });
});
