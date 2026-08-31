import { describe, expect, it } from "vitest";
import { degiskenleriYerlestir, metniBirlestir } from "@/lib/eposta-icerik";

describe("degiskenleriYerlestir", () => {
  it("bilinen değişkeni değeriyle değiştirir", () => {
    expect(degiskenleriYerlestir("Hoş geldin {ad}", { ad: "Sinem" })).toBe("Hoş geldin Sinem");
  });

  /*
    Bu ayrım metnin doğruluğunu taşıyor: tanınmayan bir ad panele yanlış
    yazılmış demek ve görünür kalmalı; tanınan ama boş bir değer ise gerçek
    bir kayıt eksiği ve maile sızmamalı.
  */
  it("akışta olmayan değişkeni olduğu gibi bırakır", () => {
    expect(degiskenleriYerlestir("Merhaba {urun}", { ad: "Sinem" })).toBe("Merhaba {urun}");
  });

  it("değeri boş olan değişkeni siler", () => {
    expect(degiskenleriYerlestir("Hoş geldin {ad}", { ad: null })).toBe("Hoş geldin");
    expect(degiskenleriYerlestir("Hoş geldin {ad}", { ad: "   " })).toBe("Hoş geldin");
  });

  it("silme sonrası noktalama öncesi boşluğu temizler", () => {
    expect(degiskenleriYerlestir("Teşekkürler {ad}, ödemen alındı.", { ad: null })).toBe(
      "Teşekkürler, ödemen alındı.",
    );
  });

  it("paragraf aralarını korur", () => {
    expect(degiskenleriYerlestir("Bir\n\nİki", {})).toBe("Bir\n\nİki");
  });
});

describe("metniBirlestir", () => {
  const varsayilan = { konu: "Varsayılan konu", ustEtiket: "Etiket", baslik: "Başlık", ozet: "Özet" };

  it("özel metin yoksa varsayılanı döndürür", () => {
    expect(metniBirlestir(varsayilan, null)).toEqual(varsayilan);
  });

  it("dolu alanı ezer, boş alanı varsayılana bırakır", () => {
    const sonuc = metniBirlestir(varsayilan, { konu: "Yeni konu", baslik: "  " });
    expect(sonuc.konu).toBe("Yeni konu");
    // Boş string "temizlendi" demek ve varsayılana dönmeli: başlıksız bir
    // mail göndermek seçenek değil.
    expect(sonuc.baslik).toBe("Başlık");
  });

  it("özel metindeki değişkenleri doldurur", () => {
    const sonuc = metniBirlestir(varsayilan, { baslik: "Merhaba {ad}" }, { ad: "Berfin" });
    expect(sonuc.baslik).toBe("Merhaba Berfin");
  });
});
