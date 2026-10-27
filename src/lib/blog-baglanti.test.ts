import { describe, expect, it } from "vitest";
import { baglantiCozucu } from "./blog-baglanti";
import { tabloKur } from "./yonlendirme";

const coz = baglantiCozucu(
  tabloKur([
    { kaynak: "/eski-yazi/", hedef: "/yeni-yazi/", kod: 301 },
    { kaynak: "/yeni-yazi/", hedef: "/en-yeni-yazi/", kod: 301 },
    { kaynak: "/silinen/", hedef: null, kod: 410 },
    { kaynak: "/disari/", hedef: "https://ahmetekinci.com.tr/", kod: 301 },
  ]),
  (y) => y === "/sepet" || y.startsWith("/tag/"),
);

describe("baglantiCozucu", () => {
  it("kendi alan adımızın mutlak adresini göreliye çevirir, çizgi ekler", () => {
    expect(coz("http://ahmetekinciakademi.com/hakkimizda")).toBe("/hakkimizda/");
    expect(coz("https://www.ahmetekinciakademi.com/meta-capi-nedir/#bolum")).toBe("/meta-capi-nedir/#bolum");
    expect(coz("https://ahmetekinciakademi.com")).toBe("/");
  });

  it("elle yazılmış taşıma listesini uygular", () => {
    expect(coz("https://ahmetekinciakademi.com/egitim/birebir-sosyal-medya-ve-reklam-uzmanligi-egitimi-2025/")).toBe(
      "/egitimler/sosyal-medya-ve-reklam-egitimi/",
    );
    expect(coz("/birebir-egitimler/?utm_source=blog")).toBe("/egitimler/?utm_source=blog");
  });

  it("panel yönlendirmelerini zincir boyunca izler", () => {
    expect(coz("/eski-yazi/")).toBe("/en-yeni-yazi/");
    expect(coz("/disari/")).toBe("https://ahmetekinci.com.tr/");
  });

  it("kaldırılmış adrese giden bağlantıyı düşürür", () => {
    expect(coz("/silinen/")).toBeNull();
    expect(coz("https://ahmetekinciakademi.com/sepet/")).toBeNull();
    expect(coz("/tag/meta/")).toBeNull();
  });

  it("dış bağlantıya ve dosyalara dokunmaz", () => {
    expect(coz("https://ahmetekinci.com.tr/freelance/")).toBe("https://ahmetekinci.com.tr/freelance/");
    expect(coz("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(coz("#bolum")).toBe("#bolum");
    expect(coz("http://ahmetekinciakademi.com/wp-content/uploads/2025/01/a.png")).toBe("/wp-content/uploads/2025/01/a.png");
  });
});
