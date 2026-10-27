import { describe, expect, it } from "vitest";
import { etiketAdresi, etiketleriTopla, etiketliMi } from "./blog-etiket";

describe("etiketler", () => {
  it("aynı etiketin farklı yazımları tek sayfa", () => {
    const t = etiketleriTopla([
      { etiketler: ["Meta Ads", "Pixel"] },
      { etiketler: ["meta ads", "meta  ads"] },
      { etiketler: ["Meta Ads", "İçerik Üretimi"] },
    ]);
    expect(t[0]).toEqual({ slug: "meta-ads", ad: "Meta Ads", adet: 3 });
    expect(t.map((e) => e.slug)).toContain("icerik-uretimi");
  });

  it("adres Türkçe harfleri sadeleştirir", () => {
    expect(etiketAdresi("Yapay Zekâ")).toBe("/blog/etiket/yapay-zeka/");
  });

  it("etiketliMi yazımdan bağımsız", () => {
    expect(etiketliMi({ etiketler: ["Meta ADS"] }, "meta-ads")).toBe(true);
    expect(etiketliMi({ etiketler: [] }, "meta-ads")).toBe(false);
  });
});
