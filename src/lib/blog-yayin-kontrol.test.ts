import { describe, expect, it } from "vitest";
import { altMetniEksikGorseller, eksikKontroller, yayinKontrolleri, type YayinKontrolGirdi } from "./blog-yayin-kontrol";

const tam: YayinKontrolGirdi = {
  baslik: "Meta CAPI Nedir?",
  ozet: "Kısa özet.",
  seoAciklama: "",
  icerik: '<p>Metin</p><figure data-gorsel=""><img src="/a.webp" alt="Ekran görüntüsü"></figure>',
  kategoriVar: true,
  kapakVar: false,
  kapakAlt: "",
  odakKelime: "meta capi",
  ayniKelime: [],
};

describe("altMetniEksikGorseller", () => {
  it("alt metni boş görseller sayılır; dekoratif işaretli figür sayılmaz", () => {
    const html =
      '<p><img src="/1.png" alt=""></p>' +
      '<img src="/2.png">' +
      '<figure data-gorsel="" data-decorative="1"><img src="/3.png" alt=""></figure>' +
      '<figure data-gorsel=""><img src="/4.png" alt="  "></figure>' +
      '<img src="/5.png" alt="Grafik">';
    expect(altMetniEksikGorseller(html)).toBe(3);
  });
  it("görselsiz içerikte sıfır", () => {
    expect(altMetniEksikGorseller("<p>yok</p>")).toBe(0);
  });
});

describe("yayinKontrolleri", () => {
  it("eksiksiz yazıda hepsi tamam", () => {
    expect(eksikKontroller(yayinKontrolleri(tam))).toEqual([]);
  });

  it("eksikleri sırayla bildirir", () => {
    const k = yayinKontrolleri({
      ...tam,
      ozet: "",
      kategoriVar: false,
      icerik: '<p>x</p><img src="/a.png" alt="">',
      kapakVar: true,
      odakKelime: "",
    });
    expect(eksikKontroller(k).map((x) => x.id)).toEqual(["aciklama", "kategori", "gorsel-alt", "kapak-alt", "odak"]);
  });

  it("SEO açıklaması özetin yerini tutar", () => {
    const k = yayinKontrolleri({ ...tam, ozet: "", seoAciklama: "Açıklama" });
    expect(k.find((x) => x.id === "aciklama")?.tamam).toBe(true);
  });

  it("aynı odak kelimeyi kullanan yazı varsa uyarır", () => {
    const k = yayinKontrolleri({ ...tam, ayniKelime: ["Meta CAPI Kurulumu"] });
    const t = k.find((x) => x.id === "odak-tekrar");
    expect(t?.tamam).toBe(false);
    expect(t?.oneri).toContain("“Meta CAPI Kurulumu”");
  });

  it("boş içerik (yalnız boşluk/&nbsp;) eksik sayılır", () => {
    expect(yayinKontrolleri({ ...tam, icerik: "<p>&nbsp;</p>" }).find((x) => x.id === "icerik")?.tamam).toBe(false);
  });
});
