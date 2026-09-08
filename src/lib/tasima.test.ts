import { describe, expect, it } from "vitest";
import { YONLENDIRMELER, UYGULAMA_YOLLARI } from "./tasima";

/**
 * Yönlendirme tablosu elle yazılıyor ve taşımadan sonra da genişleyecek.
 * Buradaki hatalar sessiz: yanlış bir satır sayfayı 404'e ya da zincire
 * sokar, kimse fark etmez, sıralama düşer. Testler o yüzden var.
 */
describe("taşıma yönlendirmeleri", () => {
  it("aynı eski adres iki kez yazılmamış", () => {
    const eskiler = YONLENDIRMELER.map((y) => y.eski);
    expect(new Set(eskiler).size).toBe(eskiler.length);
  });

  it("zincir yok — bir kaynak aynı zamanda hedef değil", () => {
    const hedefler = new Set(YONLENDIRMELER.map((y) => y.yeni));
    const zincir = YONLENDIRMELER.filter((y) => hedefler.has(y.eski));
    expect(zincir).toEqual([]);
  });

  it("kendine yönlendiren satır yok (sonsuz döngü)", () => {
    expect(YONLENDIRMELER.filter((y) => y.eski === y.yeni)).toEqual([]);
  });

  it("bütün adresler / ile başlıyor ve / ile bitmiyor", () => {
    for (const { eski, yeni } of YONLENDIRMELER) {
      expect(eski.startsWith("/")).toBe(true);
      expect(yeni.startsWith("/")).toBe(true);
      expect(eski.endsWith("/")).toBe(false);
      expect(yeni.endsWith("/")).toBe(false);
    }
  });

  it("her hedef bu uygulamanın gerçekten sunduğu bir sayfa", () => {
    for (const { eski, yeni } of YONLENDIRMELER) {
      // Eğitim detayları dinamik: /egitimler/<slug>. Slug'ın kendisi
      // veritabanından geliyor, burada yalnızca biçim doğrulanıyor.
      const egitimDetayi = /^\/egitimler\/[a-z0-9-]+$/.test(yeni);
      const bilinen = UYGULAMA_YOLLARI.includes(yeni);
      expect(egitimDetayi || bilinen, `${eski} → ${yeni} bilinmeyen bir yola gidiyor`).toBe(true);
    }
  });

  it("hedefler ana sayfaya yığılmamış (soft 404 riski)", () => {
    // Ana sayfaya yönlendirme Google'ın yok saydığı desen; tek tük olabilir
    // ama tabloya hâkim olmamalı.
    const anaSayfaya = YONLENDIRMELER.filter((y) => y.yeni === "/").length;
    expect(anaSayfaya).toBe(0);
  });
});
