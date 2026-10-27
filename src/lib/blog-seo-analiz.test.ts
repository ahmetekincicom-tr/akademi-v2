import { describe, expect, it } from "vitest";
import { SITE_ADI } from "./seo";
import { MARKA_EKI, baslikPikseli, gorunenBaslik, kelimeSay, seoAnalizEt, sozcuklereAyir } from "./blog-seo-analiz";

describe("Türkçe eşleştirme", () => {
  it("ek ve büyük harf toleranslı sayar", () => {
    expect(kelimeSay(sozcuklereAyir("Sosyal medyanın gücü. SOSYAL MEDYADA reklam."), "sosyal medya")).toBe(2);
    expect(kelimeSay(sozcuklereAyir("İstanbul'da eğitim"), "istanbul")).toBe(1);
    expect(kelimeSay(sozcuklereAyir("kitabı okudum"), "kitap")).toBe(1);
  });
});

describe("başlık", () => {
  it("marka eki lib/seo ile aynı", () => {
    expect(MARKA_EKI).toBe(` — ${SITE_ADI}`);
    expect(gorunenBaslik("", "Meta CAPI Nedir?")).toBe("Meta CAPI Nedir? — Ahmet Ekinci Akademi");
  });

  it("piksel genişliği uzun başlıkta büyür", () => {
    expect(baslikPikseli("Kısa")).toBeLessThan(baslikPikseli("Çok daha uzun bir başlık metni burada"));
  });
});

describe("seoAnalizEt", () => {
  it("odak kelime yoksa SEO durumu kötü", () => {
    const s = seoAnalizEt({ odakKelime: "", baslik: "A", seoBaslik: "", seoAciklama: "", ozet: "", slug: "a", icerik: "<p>a</p>" });
    expect(s.durum.seo).toBe("kotu");
  });

  it("odak kelime, giriş, iç bağlantı ve gövdede H1'i yakalar", () => {
    const s = seoAnalizEt({
      odakKelime: "meta pikseli",
      baslik: "Meta Pikseli Nasıl Kurulur?",
      seoBaslik: "",
      seoAciklama: "Meta pikseli kurulumu adım adım.",
      ozet: "",
      slug: "meta-pikseli-nasil-kurulur",
      icerik: '<h1>x</h1><p>Meta pikselini kurmak kolay. <a href="/egitimler/">Eğitim</a> <a href="https://ahmetekinciakademi.com/blog/">Blog</a></p><h2>Meta pikseli nedir?</h2>',
    });
    const durum = Object.fromEntries(s.kontroller.map((k) => [k.id, k.durum]));
    expect(durum["odak-baslik"]).toBe("iyi");
    expect(durum["odak-adres"]).toBe("iyi");
    expect(durum["odak-giris"]).toBe("iyi");
    expect(durum["odak-altbaslik"]).toBe("iyi");
    expect(durum["ic-baglanti"]).toBe("iyi");
    expect(durum["h1-yok"]).toBe("kotu");
    expect(s.istatistik.icBaglanti).toBe(2);
  });
});
