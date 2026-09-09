import { describe, expect, it } from "vitest";
import {
  ACIKLAMA_SINIRI,
  SEO_SAYFALARI,
  aciklamayiKisalt,
  otomatikSeo,
  yolSadelestir,
} from "@/lib/sayfa-seo";

describe("aciklamayiKisalt", () => {
  it("sınırın altındaki metne dokunmuyor", () => {
    const metin = "Kısa ve tam bir açıklama.";
    expect(aciklamayiKisalt(metin)).toBe(metin);
  });

  it("sınırı aşan metni kısaltıyor ve üç nokta koyuyor", () => {
    const metin = "kelime ".repeat(60).trim();
    const sonuc = aciklamayiKisalt(metin);
    expect(sonuc.length).toBeLessThanOrEqual(ACIKLAMA_SINIRI);
    expect(sonuc.endsWith("…")).toBe(true);
  });

  it("kelimenin ortasından kesmiyor", () => {
    /*
      Asıl kusur buydu: eski kod `metin.slice(0, 300)` yapıyor ve açıklamayı
      "…profesyonel gelişimini" yerine "…profesyone" gibi bitiriyordu.
    */
    const metin =
      "Sosyal medya, reklamcılık ve dijital pazarlama alanlarında birebir, uygulamalı ve size özel " +
      "eğitimlerle profesyonel gelişiminize yön verin ve markanızı büyütün.";
    const sonuc = aciklamayiKisalt(metin);
    const sonKelime = sonuc.replace("…", "").split(" ").pop() ?? "";
    // Kesilen son kelime, kaynak metinde tam hâliyle geçiyor olmalı.
    expect(metin.split(/\s+/)).toContain(sonKelime);
  });

  it("üç noktadan önce noktalama bırakmıyor", () => {
    const metin = `${"kelime ".repeat(20)}son, ${"kelime ".repeat(40)}`.trim();
    const sonuc = aciklamayiKisalt(metin);
    expect(sonuc).not.toMatch(/[,;:.\s]…$/);
  });

  it("kalın işaretlerini ayıklıyor", () => {
    // Ölçülen gerçek kusur: eğitim açıklaması arama sonucuna yıldızlarla
    // çıkıyordu.
    expect(aciklamayiKisalt("**Kendi reklam hesabınız** üzerinde çalışıyoruz.")).toBe(
      "Kendi reklam hesabınız üzerinde çalışıyoruz.",
    );
  });

  it("araları ve baştaki/sondaki boşlukları tekliyor", () => {
    expect(aciklamayiKisalt("  iki   boşluklu   metin  ")).toBe("iki boşluklu metin");
  });

  it("tek uzun kelimede de sınırı aşmıyor", () => {
    const sonuc = aciklamayiKisalt("a".repeat(400));
    expect(sonuc.length).toBeLessThanOrEqual(ACIKLAMA_SINIRI);
  });
});

describe("yolSadelestir", () => {
  it("sondaki eğik çizgiyi atıyor", () => {
    expect(yolSadelestir("/hakkimizda/")).toBe("/hakkimizda");
  });

  it("kök adresi bozmuyor", () => {
    expect(yolSadelestir("/")).toBe("/");
  });
});

describe("SEO_SAYFALARI", () => {
  it("yollar veritabanındaki kısıta uyuyor (çizgisiz, boşluksuz)", () => {
    for (const s of SEO_SAYFALARI) {
      expect(s.yol.startsWith("/")).toBe(true);
      expect(s.yol === "/" || !s.yol.endsWith("/")).toBe(true);
      expect(s.yol).not.toMatch(/\s/);
    }
  });

  it("aynı yol iki kez yok", () => {
    const yollar = SEO_SAYFALARI.map((s) => s.yol);
    expect(new Set(yollar).size).toBe(yollar.length);
  });

  it("her sayfanın başlığı ve açıklaması dolu", () => {
    for (const s of SEO_SAYFALARI) {
      expect(s.baslik.trim().length).toBeGreaterThan(0);
      expect(s.aciklama.trim().length).toBeGreaterThan(0);
    }
  });

  it("otomatikSeo çizgili yolu da buluyor", () => {
    expect(otomatikSeo("/hakkimizda/").baslik).toBe(otomatikSeo("/hakkimizda").baslik);
    expect(otomatikSeo("/hakkimizda").baslik.length).toBeGreaterThan(0);
  });

  it("tanınmayan yolda boş dönüyor", () => {
    expect(otomatikSeo("/boyle-bir-sayfa-yok")).toEqual({ baslik: "", aciklama: "" });
  });
});
