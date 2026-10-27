import { describe, expect, it } from "vitest";
import { ilgiliEgitim, TUM_EGITIMLER, type EgitimOzeti } from "./blog-egitim";

const egitimler: EgitimOzeti[] = [
  { slug: "meta-ads-egitimi", baslik: "Birebir Meta Business Eğitimi", aciklama: "Meta reklamlarını sıfırdan kurun.", cokYakinda: false },
  { slug: "sosyal-medya-ve-reklam-egitimi", baslik: "Birebir Sosyal Medya & Reklam Eğitimi", aciklama: "Sosyal medya yönetimi.", cokYakinda: false },
  { slug: "tiktok-ads-egitimi", baslik: "Birebir Tiktok Ads Eğitimi", aciklama: "TikTok.", cokYakinda: true },
  { slug: "yapay-zeka-egitimi", baslik: "Birebir Yapay Zekâ Eğitimi", aciklama: "YZ.", cokYakinda: true },
];

describe("ilgiliEgitim", () => {
  it("kategorinin eğitim sayfasına gider, metin eğitimin kendisinden", () => {
    const e = ilgiliEgitim("meta-business-manager", egitimler);
    expect(e.url).toBe("/egitimler/meta-ads-egitimi/");
    expect(e.baslik).toBe("Birebir Meta Business Eğitimi");
    expect(e.metin).toBe("Meta reklamlarını sıfırdan kurun.");
  });

  it("çok yakında olan eğitimi atlayıp sıradakine geçer", () => {
    expect(ilgiliEgitim("tiktok", egitimler).url).toBe("/egitimler/sosyal-medya-ve-reklam-egitimi/");
    const acildi = egitimler.map((e) => (e.slug === "tiktok-ads-egitimi" ? { ...e, cokYakinda: false } : e));
    expect(ilgiliEgitim("tiktok", acildi).url).toBe("/egitimler/tiktok-ads-egitimi/");
  });

  it("açık eğitimi yoksa ya da kategori bilinmiyorsa tüm eğitimler", () => {
    expect(ilgiliEgitim("yapay-zeka", egitimler)).toEqual(TUM_EGITIMLER);
    expect(ilgiliEgitim("google-ads", egitimler)).toEqual(TUM_EGITIMLER);
    expect(ilgiliEgitim(null, egitimler)).toEqual(TUM_EGITIMLER);
  });

  it("uzun açıklamayı kelime sınırında kısaltır", () => {
    const uzun = { ...egitimler[0], aciklama: "kelime ".repeat(60) };
    const e = ilgiliEgitim("meta-business-manager", [uzun]);
    expect(e.metin.length).toBeLessThanOrEqual(191);
    expect(e.metin.endsWith("…")).toBe(true);
    expect(e.metin).not.toMatch(/ …$/);
  });
});
