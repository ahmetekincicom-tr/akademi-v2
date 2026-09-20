import { describe, it, expect } from "vitest";
import { taslakAnahtar, taslakDegerli, taslakNispiZaman, type BlogTaslak } from "@/lib/blog-taslak";

function taslak(over: Partial<BlogTaslak> = {}): BlogTaslak {
  return {
    s: 1,
    kayitZamani: Date.now(),
    temelGuncelleme: null,
    baslik: "",
    slug: "",
    slugElle: false,
    ozet: "",
    kapakYol: null,
    durum: "taslak",
    yayinYerel: "",
    seoBaslik: "",
    seoAciklama: "",
    yazar: "",
    kategoriId: "",
    etiketMetni: "",
    icerikHtml: "",
    icerikJson: null,
    ...over,
  };
}

describe("taslakAnahtar", () => {
  it("id yoksa 'yeni' anahtarı üretir", () => {
    expect(taslakAnahtar(null)).toBe("blog-taslak:v1:yeni");
    expect(taslakAnahtar("abc")).toBe("blog-taslak:v1:abc");
  });
});

describe("taslakDegerli", () => {
  it("taslak yoksa geçersiz", () => {
    expect(taslakDegerli(null, null)).toBe(false);
  });

  it("yeni yazı: içerik/başlık boşsa değersiz, doluysa değerli", () => {
    expect(taslakDegerli(taslak(), null)).toBe(false);
    expect(taslakDegerli(taslak({ baslik: "Deneme" }), null)).toBe(true);
    expect(taslakDegerli(taslak({ icerikHtml: "<p>selam</p>" }), null)).toBe(true);
    // yalnızca boş etiketler → metin yok → değersiz
    expect(taslakDegerli(taslak({ icerikHtml: "<p></p>" }), null)).toBe(false);
  });

  it("var olan yazı: sunucu sürümü değiştiyse bayat (geçersiz)", () => {
    const sunucu = { guncelleme: "2026-01-02", baslik: "A", ozet: "o", icerikHtml: "<p>x</p>" };
    const bayat = taslak({ temelGuncelleme: "2026-01-01", icerikHtml: "<p>yeni</p>" });
    expect(taslakDegerli(bayat, sunucu)).toBe(false);
  });

  it("var olan yazı: aynı temel + farklı içerik → değerli", () => {
    const sunucu = { guncelleme: "2026-01-02", baslik: "A", ozet: "o", icerikHtml: "<p>x</p>" };
    const guncel = taslak({ temelGuncelleme: "2026-01-02", baslik: "A", ozet: "o", icerikHtml: "<p>DAHA fazla</p>" });
    expect(taslakDegerli(guncel, sunucu)).toBe(true);
  });

  it("var olan yazı: aynı temel + aynı içerik → değersiz (gösterme)", () => {
    const sunucu = { guncelleme: "2026-01-02", baslik: "A", ozet: "o", icerikHtml: "<p>x</p>" };
    const ayni = taslak({ temelGuncelleme: "2026-01-02", baslik: "A", ozet: "o", icerikHtml: "<p>x</p>" });
    expect(taslakDegerli(ayni, sunucu)).toBe(false);
  });
});

describe("taslakNispiZaman", () => {
  it("eşikleri doğru etiketler", () => {
    expect(taslakNispiZaman(Date.now())).toBe("az önce");
    expect(taslakNispiZaman(Date.now() - 5 * 60000)).toBe("5 dk önce");
    expect(taslakNispiZaman(Date.now() - 3 * 3600000)).toBe("3 sa önce");
    expect(taslakNispiZaman(Date.now() - 2 * 86400000)).toBe("2 gün önce");
  });
});
