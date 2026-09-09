import { describe, expect, it } from "vitest";
import { duzMetin, htmlsiz, blogBlogu } from "@/lib/llms";

describe("duzMetin", () => {
  it("kalın işaretlerini ayıklıyor", () => {
    // Panelden girilen metinlerde **çift yıldız** kalın demek; düz metin
    // dosyasında ham yıldız olarak görünürdü.
    expect(duzMetin("**Kendi hesabınız** üzerinde")).toBe("Kendi hesabınız üzerinde");
  });

  it("satır sonlarını ve fazla boşlukları tekliyor", () => {
    expect(duzMetin("bir\n\niki   üç\t dört ")).toBe("bir iki üç dört");
  });

  it("boş değerlerde patlamıyor", () => {
    expect(duzMetin(null)).toBe("");
    expect(duzMetin(undefined)).toBe("");
  });
});

describe("htmlsiz", () => {
  it("etiketleri atıyor", () => {
    expect(htmlsiz("<p>Merhaba <strong>dünya</strong></p>")).toBe("Merhaba dünya");
  });

  it("WordPress'in kodladığı Türkçe harfleri çözüyor", () => {
    // WordPress özetleri Türkçe harfleri sayısal varlık olarak veriyor;
    // çözülmezse llms.txt'te "ad&#305;m ad&#305;m" yazardı.
    expect(htmlsiz("ad&#305;m ad&#305;m")).toBe("adım adım");
  });

  it("yaygın tipografik varlıkları çözüyor", () => {
    expect(htmlsiz("API&#8217;nin &#8211; k&#305;sa")).toBe("API'nin – kısa");
    expect(htmlsiz("CAPI Nedir &amp; Neden")).toBe("CAPI Nedir & Neden");
  });

  it("boşlukları tekliyor", () => {
    expect(htmlsiz("<p>bir</p>\n<p>iki</p>")).toBe("bir iki");
  });
});

describe("blogBlogu", () => {
  const yazi = { baslik: "Bir yazı", adres: "https://ornek.com/yazi/", ozet: "Özet", tarih: "2026-01-02" };

  it("yazı yoksa yine blog bağlantısı bırakıyor", () => {
    /*
      WordPress erişilemediğinde liste boş dönüyor. O durumda bölümü tamamen
      atlamak, yapay zekâ araçlarına "bu sitede blog yok" demek olurdu.
    */
    const satirlar = blogBlogu([], false);
    expect(satirlar.join("\n")).toContain("/blog/");
  });

  it("dizin biçiminde tek satırlık bağlantı veriyor", () => {
    const metin = blogBlogu([yazi], false).join("\n");
    expect(metin).toContain("- [Bir yazı](https://ornek.com/yazi/)");
    expect(metin).not.toContain("Özet:");
  });

  it("tam metin biçiminde özet ve tarih de veriyor", () => {
    const metin = blogBlogu([yazi], true).join("\n");
    expect(metin).toContain("### Bir yazı");
    expect(metin).toContain("- Özet: Özet");
    expect(metin).toContain("- Güncelleme: 2026-01-02");
  });
});
