import { describe, it, expect } from "vitest";
import { seoTabanAd, storageYolu } from "@/lib/gorsel-ad";

describe("seoTabanAd", () => {
  it("kaynak önceliği: özel ad > caption > alt > slug", () => {
    expect(seoTabanAd({ ozelAd: "Özel Ad", caption: "cap", alt: "alt", yaziSlug: "slug" })).toBe("ozel-ad");
    expect(seoTabanAd({ caption: "ChatGPT Meta Ads MCP", alt: "alt", yaziSlug: "slug" })).toBe(
      "chatgpt-meta-ads-mcp",
    );
    expect(seoTabanAd({ alt: "Alt Metin", yaziSlug: "slug" })).toBe("alt-metin");
    expect(seoTabanAd({ yaziSlug: "meta-ads-mcp-baglantisi" })).toBe("meta-ads-mcp-baglantisi");
  });

  it("Türkçe karakterleri normalize eder, boşlukları tireye çevirir", () => {
    expect(seoTabanAd({ ozelAd: "İçğüşöÇ Şeması" })).toBe("icgusoc-semasi");
  });

  it("hepsi boşsa 'gorsel' döner", () => {
    expect(seoTabanAd({})).toBe("gorsel");
    expect(seoTabanAd({ caption: "   ", alt: "!!!" })).toBe("gorsel");
  });

  it("aşırı uzun adı kırpar", () => {
    const uzun = "a".repeat(200);
    expect(seoTabanAd({ ozelAd: uzun }).length).toBeLessThanOrEqual(60);
  });
});

describe("storageYolu", () => {
  it("blog/yıl/ay/ad-ek.uzanti yapısında üretir", () => {
    const yol = storageYolu("chatgpt-meta-ads-mcp-baglantisi", "webp", new Date("2026-09-19T00:00:00Z"));
    expect(yol).toMatch(/^blog\/2026\/09\/chatgpt-meta-ads-mcp-baglantisi-[0-9a-f]{4}\.webp$/);
  });

  it("uzantıyı sanitize eder ve adı normalize eder", () => {
    const yol = storageYolu("Şema Görseli", "PNG", new Date("2026-01-05T00:00:00Z"));
    expect(yol).toMatch(/^blog\/2026\/01\/sema-gorseli-[0-9a-f]{4}\.png$/);
  });

  it("her çağrıda benzersiz son ek üretir", () => {
    const a = storageYolu("ad", "webp");
    const b = storageYolu("ad", "webp");
    expect(a).not.toBe(b);
  });
});
