import { describe, expect, it } from "vitest";
import { depoSiteAdresi, wpAdresleriniDegistir, wpDepoYolu, wpGorselleriBul, wpIndirmeAdresi, wpKapakYolu } from "./wp-gorsel";

const ORNEK = `<p><a href="http://ahmetekinciakademi.com/wp-content/uploads/2026/02/Meta-CAPI.png"><img src="http://ahmetekinciakademi.com/wp-content/uploads/2026/02/Meta-CAPI.png" alt="a"></a></p>
<img src="https://www.ahmetekinciakademi.com/wp-content/uploads/2025/01/Hata-2.png?ver=3" srcset="/wp-content/uploads/2025/01/Hata-2-300x200.png 300w, /wp-content/uploads/2025/01/Hata-2.png 900w">
<div style="background-image:url(/wp-content/uploads/2024/05/arka.jpg)"></div>
<a href="https://ornek.com/wp-content/uploads/2024/01/baskasi.png">dış site</a>`;

describe("wpGorselleriBul", () => {
  it("her biçimi bulur, tekrarsız", () => {
    expect(wpGorselleriBul(ORNEK)).toEqual([
      "2026/02/Meta-CAPI.png",
      "2025/01/Hata-2.png",
      "2025/01/Hata-2-300x200.png",
      "2024/05/arka.jpg",
    ]);
  });

  it("başka alan adının görseline dokunmaz", () => {
    expect(wpGorselleriBul('<img src="https://ornek.com/wp-content/uploads/a.png">')).toEqual([]);
  });

  it("JSON içinde de bulur", () => {
    const json = JSON.stringify({ type: "image", attrs: { src: "http://ahmetekinciakademi.com/wp-content/uploads/2026/08/x.png" } });
    expect(wpGorselleriBul(json)).toEqual(["2026/08/x.png"]);
  });
});

describe("wpDepoYolu", () => {
  it("klasör yapısını korur, adı ASCII'ye çevirir", () => {
    expect(wpDepoYolu("2026/02/Meta-CAPI-Conversions-API-Nedir-.png")).toBe("blog/wp/2026/02/Meta-CAPI-Conversions-API-Nedir.png");
    expect(wpDepoYolu("2025/11/Görsel Şekil ğüı.jpg")).toBe("blog/wp/2025/11/Gorsel-Sekil-gui.jpg");
    expect(wpDepoYolu("2025/11/G%C3%B6rsel.jpg")).toBe("blog/wp/2025/11/Gorsel.jpg");
  });

  it("GIF depoda WebP", () => {
    expect(wpDepoYolu("2025/03/Instagrama-Konum-Ekleme-12.gif")).toBe("blog/wp/2025/03/Instagrama-Konum-Ekleme-12.webp");
    expect(depoSiteAdresi(wpDepoYolu("2025/03/a.GIF"))).toBe("/dosya/kapaklar/blog/wp/2025/03/a.webp");
  });
});

describe("wpIndirmeAdresi", () => {
  it("kodlanmamış adı kodlar, kodlanmışa dokunmaz", () => {
    expect(wpIndirmeAdresi("https://wp.ahmetekinciakademi.com/", "2025/11/Görsel.jpg")).toBe(
      "https://wp.ahmetekinciakademi.com/wp-content/uploads/2025/11/G%C3%B6rsel.jpg",
    );
    expect(wpIndirmeAdresi("https://wp.ahmetekinciakademi.com", "2025/11/G%C3%B6rsel.jpg")).toBe(
      "https://wp.ahmetekinciakademi.com/wp-content/uploads/2025/11/G%C3%B6rsel.jpg",
    );
  });
});

describe("wpAdresleriniDegistir", () => {
  it("yalnız taşınanı değiştirir", () => {
    const tasinan = new Set(["2026/02/Meta-CAPI.png", "2025/01/Hata-2.png"]);
    const sonuc = wpAdresleriniDegistir(ORNEK, tasinan);
    expect(sonuc).toContain('href="/dosya/kapaklar/blog/wp/2026/02/Meta-CAPI.png"');
    expect(sonuc).toContain('src="/dosya/kapaklar/blog/wp/2026/02/Meta-CAPI.png"');
    // Sorgu dizgisi (?ver=3) de gidiyor.
    expect(sonuc).toContain('src="/dosya/kapaklar/blog/wp/2025/01/Hata-2.png" srcset');
    // Taşınmayan (küçük boy, arka plan) olduğu gibi.
    expect(sonuc).toContain("/wp-content/uploads/2025/01/Hata-2-300x200.png 300w");
    expect(sonuc).toContain("url(/wp-content/uploads/2024/05/arka.jpg)");
    expect(sonuc).toContain("https://ornek.com/wp-content/uploads/2024/01/baskasi.png");
    expect(sonuc).not.toContain("http://ahmetekinciakademi.com");
  });

  it("depo adresinde Türkçe karakter kalmaz", () => {
    expect(depoSiteAdresi(wpDepoYolu("2025/11/Görsel.jpg"))).toBe("/dosya/kapaklar/blog/wp/2025/11/Gorsel.jpg");
  });
});

describe("wpKapakYolu", () => {
  it("taşınan tam adresi depo yoluna çevirir", () => {
    const tasinan = new Set(["2026/02/Meta-CAPI.png"]);
    expect(wpKapakYolu("http://ahmetekinciakademi.com/wp-content/uploads/2026/02/Meta-CAPI.png", tasinan)).toBe(
      "blog/wp/2026/02/Meta-CAPI.png",
    );
    expect(wpKapakYolu("blog/123-kapak.webp", tasinan)).toBe("blog/123-kapak.webp");
    expect(wpKapakYolu(null, tasinan)).toBeNull();
  });
});
