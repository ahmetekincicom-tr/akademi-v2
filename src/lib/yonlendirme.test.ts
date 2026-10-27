import { describe, expect, it } from "vitest";
import { YONETIM_KOKU } from "@/proxy";
import {
  hedefAdresi,
  hedefDuzenle,
  kaynakAnahtari,
  kaynakDuzenle,
  tabloKur,
  yonlendirmeAranir,
  yonlendirmeBul,
} from "./yonlendirme";

const tablo = tabloKur([
  { kaynak: "/eski-yazi/", hedef: "/yeni-yazi/", kod: 301 },
  { kaynak: "/kaldirilan/", hedef: null, kod: 410 },
  { kaynak: "/%C3%A7orba/", hedef: "/blog/", kod: 301 },
  // Bozuk satır (301 ama hedefsiz): yok sayılır.
  { kaynak: "/bozuk/", hedef: null, kod: 301 },
]);

describe("yonlendirmeBul", () => {
  it("çizgili ve çizgisiz yolu aynı kaynakla eşleştirir", () => {
    expect(yonlendirmeBul(tablo, "/eski-yazi/")).toEqual({ hedef: "/yeni-yazi/", kod: 301 });
    expect(yonlendirmeBul(tablo, "/eski-yazi")).toEqual({ hedef: "/yeni-yazi/", kod: 301 });
  });

  it("410 satırını döndürür", () => {
    expect(yonlendirmeBul(tablo, "/kaldirilan/")).toEqual({ hedef: null, kod: 410 });
  });

  it("kodlanmış ve düz Türkçe karakter aynı adres", () => {
    expect(yonlendirmeBul(tablo, "/çorba/")).toEqual({ hedef: "/blog/", kod: 301 });
    expect(yonlendirmeBul(tablo, "/%C3%A7orba/")).toEqual({ hedef: "/blog/", kod: 301 });
  });

  it("hedefsiz 301 ve eşleşmeyen yol null", () => {
    expect(yonlendirmeBul(tablo, "/bozuk/")).toBeNull();
    expect(yonlendirmeBul(tablo, "/baska/")).toBeNull();
  });

  it("yönetim, panel ve API'ye hiçbir satır uygulanmaz", () => {
    const tehlikeli = tabloKur([
      { kaynak: `${YONETIM_KOKU}/`, hedef: "/", kod: 301 },
      { kaynak: "/panel/", hedef: "/", kod: 301 },
      { kaynak: "/api/gorevler/", hedef: "/", kod: 301 },
    ]);
    expect(yonlendirmeBul(tehlikeli, `${YONETIM_KOKU}/`)).toBeNull();
    expect(yonlendirmeBul(tehlikeli, "/panel/")).toBeNull();
    expect(yonlendirmeBul(tehlikeli, "/api/gorevler/")).toBeNull();
    expect(yonlendirmeAranir("/")).toBe(false);
    expect(yonlendirmeAranir("/meta-capi-nedir/")).toBe(true);
  });
});

describe("kaynakAnahtari", () => {
  it("sona çizgi ekler, olanı korur", () => {
    expect(kaynakAnahtari("/a")).toBe("/a/");
    expect(kaynakAnahtari("/a/")).toBe("/a/");
  });
});

describe("hedefAdresi", () => {
  it("kampanya parametrelerini taşır", () => {
    expect(hedefAdresi("/yeni/", "https://ahmetekinciakademi.com/eski/?utm_source=ig").toString()).toBe(
      "https://ahmetekinciakademi.com/yeni/?utm_source=ig",
    );
  });

  it("hedefin kendi sorgusu varsa ona dokunmaz", () => {
    expect(hedefAdresi("/iletisim/?konu=a", "https://ahmetekinciakademi.com/eski/?b=1").toString()).toBe(
      "https://ahmetekinciakademi.com/iletisim/?konu=a",
    );
  });

  it("dış hedefe gider", () => {
    expect(hedefAdresi("https://ahmetekinci.com.tr/blog/", "https://ahmetekinciakademi.com/x/").toString()).toBe(
      "https://ahmetekinci.com.tr/blog/",
    );
  });
});

describe("hedefDuzenle / kaynakDuzenle", () => {
  it("göreli yolu çizgiler", () => {
    expect(hedefDuzenle("meta-capi-nedir")).toBe("/meta-capi-nedir/");
    expect(hedefDuzenle("/blog")).toBe("/blog/");
    expect(hedefDuzenle("/iletisim/?konu=a")).toBe("/iletisim/?konu=a");
    expect(hedefDuzenle("/iletisim?konu=a")).toBe("/iletisim/?konu=a");
    expect(hedefDuzenle("/blog/rss.xml")).toBe("/blog/rss.xml");
  });

  it("kendi alan adımızı göreli yazar, dış https'i korur", () => {
    expect(hedefDuzenle("https://ahmetekinciakademi.com/blog")).toBe("/blog/");
    expect(hedefDuzenle("https://www.ahmetekinciakademi.com")).toBe("/");
    expect(hedefDuzenle("https://ahmetekinci.com.tr/blog/")).toBe("https://ahmetekinci.com.tr/blog/");
  });

  it("tehlikeli ya da bozuk hedefi reddeder", () => {
    for (const kotu of ["", "javascript:alert(1)", "http://ornek.com", "//ornek.com", "/a b/"]) {
      expect(hedefDuzenle(kotu)).toBeNull();
    }
  });

  it("kaynak yalnız sitedeki bir yol olabilir", () => {
    expect(kaynakDuzenle("eski-yazi")).toBe("/eski-yazi/");
    expect(kaynakDuzenle("https://ahmetekinciakademi.com/eski/")).toBe("/eski/");
    expect(kaynakDuzenle("/")).toBeNull();
    expect(kaynakDuzenle("/a/?b=1")).toBeNull();
    expect(kaynakDuzenle("https://ornek.com/a/")).toBeNull();
    expect(kaynakDuzenle("/dosya.pdf")).toBeNull();
  });
});
