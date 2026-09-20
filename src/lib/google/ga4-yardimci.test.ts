import { describe, it, expect } from "vitest";
import { yolaSlug, yuzdeDegisim } from "@/lib/google/ga4-yardimci";

describe("yolaSlug (URL normalizasyonu)", () => {
  it("sondaki çizgi ve çizgisiz aynı slug", () => {
    expect(yolaSlug("/meta-ads-mcp-baglantisi-nasil-yapilir/")).toBe("meta-ads-mcp-baglantisi-nasil-yapilir");
    expect(yolaSlug("/meta-ads-mcp-baglantisi-nasil-yapilir")).toBe("meta-ads-mcp-baglantisi-nasil-yapilir");
  });
  it("query string ayrı sayılmaz", () => {
    expect(yolaSlug("/deneme-yazi/?utm_source=fb")).toBe("deneme-yazi");
  });
  it("çok segmentli (blog dışı) yol → null", () => {
    expect(yolaSlug("/egitimler/meta-ads-egitimi/")).toBeNull();
    expect(yolaSlug("/")).toBeNull();
    expect(yolaSlug("")).toBeNull();
  });
});

describe("yuzdeDegisim", () => {
  it("normal artış/azalış", () => {
    expect(yuzdeDegisim(131, 100)).toBe(31);
    expect(yuzdeDegisim(70, 100)).toBe(-30);
  });
  it("önceki dönem 0/yoksa null (yanıltıcı yüzde yok)", () => {
    expect(yuzdeDegisim(50, 0)).toBeNull();
    expect(yuzdeDegisim(50, -1)).toBeNull();
  });
});
