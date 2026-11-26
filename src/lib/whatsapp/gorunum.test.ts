import { describe, expect, it } from "vitest";
import { kaynakBul, mesajOnizleme, numaraBicimle, turEtiketi } from "./gorunum";

describe("numaraBicimle", () => {
  it("Türkiye numaralarını gruplar", () => {
    expect(numaraBicimle("908503071259")).toBe("+90 850 307 12 59");
    expect(numaraBicimle("905321234567")).toBe("+90 532 123 45 67");
  });
  it("başka ülkelerde ham rakam", () => {
    expect(numaraBicimle("4915112345678")).toBe("+4915112345678");
  });
});

describe("mesajOnizleme / turEtiketi", () => {
  it("metin, medya ve açıklamalı medya", () => {
    expect(mesajOnizleme({ tur: "text", metin: "Merhaba" })).toBe("Merhaba");
    expect(mesajOnizleme({ tur: "image", metin: null })).toBe("Fotoğraf");
    expect(mesajOnizleme({ tur: "image", metin: "dekont" })).toBe("Fotoğraf: dekont");
    expect(turEtiketi("bilinmeyen")).toBe("Mesaj");
  });
});

describe("kaynakBul", () => {
  it("öncelik sırası: WhatsApp reklamı, Google, Meta, site, doğrudan", () => {
    expect(kaynakBul({ ctwa: true, kod: true, gclid: "g", fbc: "f" })).toBe("ctwa");
    expect(kaynakBul({ ctwa: false, kod: true, gclid: "g", fbc: "f" })).toBe("google");
    expect(kaynakBul({ ctwa: false, kod: true, fbc: "f" })).toBe("meta");
    expect(kaynakBul({ ctwa: false, kod: true })).toBe("site");
    expect(kaynakBul({ ctwa: false, kod: false })).toBe("dogrudan");
  });
});
