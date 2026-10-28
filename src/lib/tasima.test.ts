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
      // Ana sayfa hedefi ("/") tek istisna: kökün kendisi eğik çizgidir.
      if (yeni !== "/") expect(yeni.endsWith("/")).toBe(false);
    }
  });

  it("her hedef bu uygulamanın gerçekten sunduğu bir sayfa", () => {
    for (const { eski, yeni } of YONLENDIRMELER) {
      // Eğitim detayları dinamik: /egitimler/<slug>. Slug'ın kendisi
      // veritabanından geliyor, burada yalnızca biçim doğrulanıyor.
      const egitimDetayi = /^\/egitimler\/[a-z0-9-]+$/.test(yeni);
      const bilinen = UYGULAMA_YOLLARI.includes(yeni);
      // Blog yazıları da veritabanında ve kökte; hedef olarak kullanılanlar
      // tek tek yazılı (28.10.2026'da yayında).
      const yazi = ["/nasil-sosyal-medya-uzmani-olunur", "/meta-business-reklamlarinda-crm-kullanimi"].includes(yeni);
      expect(egitimDetayi || bilinen || yazi, `${eski} → ${yeni} bilinmeyen bir yola gidiyor`).toBe(true);
    }
  });

  it("eğitim hedefleri bugün yayında olan eğitimler", () => {
    // Eğitimler veritabanında; liste 28.10.2026 itibarıyla. Bir eğitim
    // kaldırılırsa ya da adresi değişirse buradan ve tablodan güncelleyin:
    // ölü bir eğitime giden yönlendirme 404'e gönderiyor (Ankara ve
    // işletmelere özel eğitim hedefleri böyle kalmıştı).
    const EGITIMLER = ["meta-ads-egitimi", "sosyal-medya-ve-reklam-egitimi", "yapay-zeka-egitimi", "tiktok-ads-egitimi"];
    for (const { eski, yeni } of YONLENDIRMELER) {
      const m = /^\/egitimler\/([a-z0-9-]+)$/.exec(yeni);
      if (m) expect(EGITIMLER, `${eski} → ${yeni}`).toContain(m[1]);
    }
  });

  it("hedefler ana sayfaya yığılmamış (soft 404 riski)", () => {
    // Ana sayfaya yönlendirme Google'ın yok saydığı desen; tek tük olabilir
    // (ör. eski WordPress ana sayfa kopyası /ana-sayfa) ama tabloya hâkim
    // olmamalı. Karşılıksız sayfalar 410 dönüyor, ana sayfaya yığılmıyor.
    const anaSayfaya = YONLENDIRMELER.filter((y) => y.yeni === "/").length;
    expect(anaSayfaya).toBeLessThanOrEqual(1);
  });
});
