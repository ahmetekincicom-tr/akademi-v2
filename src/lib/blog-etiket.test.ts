import { describe, expect, it } from "vitest";
import {
  etiketAdresi,
  etiketleriAyir,
  etiketleriDuzenle,
  etiketleriTopla,
  etiketliMi,
  etiketOnerileri,
  etiketSec,
  etiketYazimFarklari,
} from "./blog-etiket";

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


describe("panel etiket önerisi", () => {
  const mevcut = [
    { slug: "meta-ads", ad: "Meta Ads", adet: 6 },
    { slug: "instagram", ad: "Instagram", adet: 5 },
    { slug: "meta-pixel", ad: "Meta Pixel", adet: 2 },
    { slug: "tiktok-reklam", ad: "TikTok Reklam", adet: 1 },
  ];

  it("boş parçada en çok kullanılanlar; yazıda olanlar hariç", () => {
    expect(etiketOnerileri("Instagram, ", mevcut, 2).map((e) => e.ad)).toEqual(["Meta Ads", "Meta Pixel"]);
  });

  it("yazılan parçayla başlayan önde, içinde geçen sonra; Türkçe harf farkı yok", () => {
    expect(etiketOnerileri("meta", mevcut).map((e) => e.ad)).toEqual(["Meta Ads", "Meta Pixel"]);
    expect(etiketOnerileri("REKLAM", mevcut).map((e) => e.ad)).toEqual(["TikTok Reklam"]);
    expect(etiketOnerileri("İnstag", mevcut).map((e) => e.ad)).toEqual(["Instagram"]);
  });

  it("tam yazılmış etiket kendini önermez", () => {
    expect(etiketOnerileri("meta ads", mevcut).map((e) => e.ad)).toEqual([]);
  });

  it("öneri seçilince son parça değişir", () => {
    expect(etiketSec("Instagram, met", "Meta Ads")).toBe("Instagram, Meta Ads, ");
    expect(etiketSec("", "Meta Ads")).toBe("Meta Ads, ");
  });

  it("farklı yazım bulunur ve kayıtta var olan yazıma çevrilir; tekrarlar düşer", () => {
    const e = etiketleriAyir("meta ads, Yeni Etiket, META  ADS, instagram");
    expect(etiketYazimFarklari(e, mevcut)).toEqual([
      { yazilan: "meta ads", kanonik: "Meta Ads" },
      { yazilan: "META ADS", kanonik: "Meta Ads" },
      { yazilan: "instagram", kanonik: "Instagram" },
    ]);
    expect(etiketleriDuzenle(e, mevcut)).toEqual(["Meta Ads", "Yeni Etiket", "Instagram"]);
  });
});
