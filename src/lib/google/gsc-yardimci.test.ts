import { describe, it, expect } from "vitest";
import { gscYolaSlug, gscSlugRegex, agirlikliPozisyon } from "@/lib/google/gsc-yardimci";

describe("gscYolaSlug", () => {
  it("tam URL'den kök slug çıkarır (trailing slash + host + protokol)", () => {
    expect(gscYolaSlug("https://ahmetekinciakademi.com/sosyal-medya-egitimi-fiyatlari/")).toBe(
      "sosyal-medya-egitimi-fiyatlari",
    );
    expect(gscYolaSlug("http://www.ahmetekinciakademi.com/meta-nedir")).toBe("meta-nedir");
  });

  it("query ve fragment ayıklanır", () => {
    expect(gscYolaSlug("https://x.com/slug/?utm_source=google#bolum")).toBe("slug");
  });

  it("ana sayfa ve çok segmentli yollar için null", () => {
    expect(gscYolaSlug("https://x.com/")).toBeNull();
    expect(gscYolaSlug("https://x.com/blog/kategori/")).toBeNull();
  });

  it("yol biçiminde (host'suz) de çalışır", () => {
    expect(gscYolaSlug("/deneme-yazi/")).toBe("deneme-yazi");
  });
});

describe("gscSlugRegex", () => {
  it("aynı slug'ın host/trailing varyantlarını yakalar, başkasını yakalamaz", () => {
    const re = new RegExp(gscSlugRegex("meta-nedir"));
    expect(re.test("https://ahmetekinciakademi.com/meta-nedir/")).toBe(true);
    expect(re.test("https://www.ahmetekinciakademi.com/meta-nedir")).toBe(true);
    expect(re.test("https://x.com/meta-nedir/?utm=1")).toBe(true);
    expect(re.test("https://x.com/meta-nedir-2/")).toBe(false);
    expect(re.test("https://x.com/onceki/meta-nedir/")).toBe(false);
  });

  it("regex özel karakterlerini kaçırır", () => {
    const re = new RegExp(gscSlugRegex("a.b+c"));
    expect(re.test("https://x.com/a.b+c/")).toBe(true);
    expect(re.test("https://x.com/axbyc/")).toBe(false);
  });
});

describe("agirlikliPozisyon", () => {
  it("gösterimle ağırlıklı ortalama", () => {
    // (2*100 + 8*900) / 1000 = 7.4
    expect(
      agirlikliPozisyon([
        { position: 2, impressions: 100 },
        { position: 8, impressions: 900 },
      ]),
    ).toBeCloseTo(7.4, 5);
  });
  it("gösterim yoksa 0", () => {
    expect(agirlikliPozisyon([{ position: 5, impressions: 0 }])).toBe(0);
  });
});
