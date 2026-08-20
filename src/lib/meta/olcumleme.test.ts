import { describe, expect, it } from "vitest";
import { cerezAlanAdi, cerezdenOku, izniCoz, reklamIzniVar } from "@/lib/izin";
import { fbcKur } from "@/lib/meta/fbc";
import { epostaHash, kimlikKur, kimlikYeterliMi, telefonHash } from "@/lib/meta/kimlik";
import { OLAYLAR } from "@/lib/meta/olaylar";

/**
 * Meta ölçümlemesinin sessizce bozulabilen parçaları.
 *
 * Buradaki hataların ortak özelliği: hiçbiri hata vermiyor. Yanlış
 * normalleştirilmiş bir telefon Meta'ya gidiyor, 200 dönüyor ve hiçbir zaman
 * eşleşmiyor. Yanlış kapsamlı bir çerez tarayıcıda sessizce reddediliyor ve
 * ana site ile panel birbirini görmüyor. Ekranda görünen tek belirti "reklam
 * çalışmıyor" oluyor ve sebebi burada aranmıyor.
 */

describe("çerez alan adı", () => {
  it("alt alan adlarını kapsayan alan adını üretiyor", () => {
    // Asıl mesele bu: WordPress'teki ana site ile paneldeki alt alan adı
    // aynı izni ve aynı _fbc'yi görmek zorunda.
    expect(cerezAlanAdi("panel.ahmetekinciakademi.com")).toBe(".ahmetekinciakademi.com");
    expect(cerezAlanAdi("ahmetekinciakademi.com")).toBe(".ahmetekinciakademi.com");
    expect(cerezAlanAdi("www.ahmetekinciakademi.com")).toBe(".ahmetekinciakademi.com");
  });

  it("iki seviyeli son eklerde bir üst parçayı alıyor", () => {
    // ".com.tr" yazılsaydı tarayıcı çerezi reddederdi — sessizce, hata
    // vermeden. Son iki parçayı körü körüne almanın tuzağı bu.
    expect(cerezAlanAdi("panel.ahmetekinci.com.tr")).toBe(".ahmetekinci.com.tr");
    expect(cerezAlanAdi("ahmetekinci.com.tr")).toBe(".ahmetekinci.com.tr");
  });

  it("kapsamlı çerezin yazılamayacağı yerlerde null dönüyor", () => {
    // vercel.app genel bir son ek; ".vercel.app" da reddedilirdi.
    expect(cerezAlanAdi("akademi-v2.vercel.app")).toBeNull();
    expect(cerezAlanAdi("localhost")).toBeNull();
    expect(cerezAlanAdi("localhost:3000")).toBeNull();
    expect(cerezAlanAdi("127.0.0.1")).toBeNull();
  });
});

describe("çerez okuma", () => {
  it("ad sınırına dikkat ediyor", () => {
    const dizge = "eski-aea-izin=yanlis; aea-izin=dogru; baska=x";
    // Basit bir indexOf araması "eski-aea-izin"i yakalar ve yanlış izni
    // okurdu — üstelik o değer de geçerli bir JSON olabilir.
    expect(cerezdenOku(dizge, "aea-izin")).toBe("dogru");
  });

  it("olmayan çerezde null dönüyor", () => {
    expect(cerezdenOku("a=1; b=2", "aea-izin")).toBeNull();
  });
});

describe("izin çözümleme", () => {
  it("geçerli kaydı okuyor", () => {
    const ham = encodeURIComponent(JSON.stringify({ analitik: true, reklam: true, tarih: "2026-01-01" }));
    expect(reklamIzniVar(izniCoz(ham))).toBe(true);
  });

  it("bozuk ya da eksik kayıtta null dönüyor", () => {
    // Yarım okunmuş bir izin, verilmemiş izinden tehlikeli olurdu.
    expect(izniCoz("{bozuk")).toBeNull();
    expect(izniCoz(encodeURIComponent(JSON.stringify({ analitik: true })))).toBeNull();
    expect(izniCoz(null)).toBeNull();
    expect(reklamIzniVar(null)).toBe(false);
  });
});

describe("telefon normalleştirme", () => {
  it("aynı numaranın farklı yazımları aynı hash'i veriyor", () => {
    /*
      Bu testin sebebi: veritabanındaki telefonlar tek biçimde değil. Aynı
      kişi "+90 555 111 22 33" ve "0555 111 22 33" olarak iki farklı hash
      üretseydi, Meta ikisini de tanımaz ve eşleşme sessizce sıfıra düşerdi.
    */
    const beklenen = telefonHash("+90 555 111 22 33");
    expect(beklenen).not.toBeNull();
    expect(telefonHash("0555 111 22 33")).toBe(beklenen);
    expect(telefonHash("5551112233")).toBe(beklenen);
    expect(telefonHash("905551112233")).toBe(beklenen);
    expect(telefonHash("00905551112233")).toBe(beklenen);
  });

  it("anlamsız numarayı eliyor", () => {
    expect(telefonHash("123")).toBeNull();
    expect(telefonHash("")).toBeNull();
    expect(telefonHash(null)).toBeNull();
  });
});

describe("e-posta normalleştirme", () => {
  it("büyük harf ve boşluğa bakmıyor", () => {
    expect(epostaHash("  Kisi@Ornek.COM ")).toBe(epostaHash("kisi@ornek.com"));
  });

  it("e-posta olmayanı eliyor", () => {
    // Boş dizgenin hash'i de geçerli bir hash'tir; gönderilseydi Meta onu
    // gerçek bir kimlik sanıp eşleşme oranını düşürürdü.
    expect(epostaHash("kisi")).toBeNull();
    expect(epostaHash("")).toBeNull();
  });
});

describe("kimlik yeterliliği", () => {
  it("hiçbir eşleştirme parametresi yoksa yetersiz", () => {
    // IP ve tarayıcı kimliği bir kişiyi değil bir isteği tarif ediyor;
    // tek başlarına gönderilen olay kimseye bağlanamaz.
    const kimlik = kimlikKur({ ip: "1.2.3.4", ua: "Mozilla/5.0" });
    expect(kimlikYeterliMi(kimlik)).toBe(false);
  });

  it("e-posta ya da tıklama kimliği varsa yeterli", () => {
    expect(kimlikYeterliMi(kimlikKur({ eposta: "kisi@ornek.com" }))).toBe(true);
    expect(kimlikYeterliMi(kimlikKur({ fbc: "fb.1.123.abc" }))).toBe(true);
  });

  it("boş alanları hiç yazmıyor", () => {
    const kimlik = kimlikKur({ eposta: "kisi@ornek.com", telefon: "", ad: null });
    expect(kimlik.em).toHaveLength(1);
    expect(kimlik).not.toHaveProperty("ph");
    expect(kimlik).not.toHaveProperty("fn");
  });
});

describe("tıklama kimliği biçimi", () => {
  it("Meta'nın beklediği sarmalı kuruyor", () => {
    // Ham fbclid tek başına gönderilemiyor; yanlış biçim SESSİZCE yok
    // sayılıyor, hata dönmüyor.
    expect(fbcKur("AbC-123_x", 1700000000000)).toBe("fb.1.1700000000000.AbC-123_x");
  });

  it("beklenmeyen karakterli değeri reddediyor", () => {
    // Reklam bağlantısına elle bir şey eklenmiş olabilir; onu çereze yazmak,
    // sonradan Meta'ya gidecek bir değeri dışarıdan yazdırmak demek.
    expect(fbcKur("abc;<script>")).toBeNull();
    expect(fbcKur("")).toBeNull();
    expect(fbcKur("x".repeat(500))).toBeNull();
  });
});

describe("olay kataloğu", () => {
  it("AEM öncelikleri 1-8 arasında ve tekil", () => {
    /*
      Meta iOS kullanıcıları için alan adı başına en fazla 8 olayı öncelik
      sırasıyla sayıyor. Aynı numaranın iki olaya verilmesi ya da 8'in
      aşılması, Business Manager'da kurulamayan bir sıra demek — ve
      iPhone'dan gelen satışlar raporda kaybolur.
    */
    const oncelikler = OLAYLAR.map((o) => o.oncelik);
    expect(new Set(oncelikler).size).toBe(OLAYLAR.length);
    expect(Math.min(...oncelikler)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...oncelikler)).toBeLessThanOrEqual(8);
  });

  it("Purchase en yüksek öncelikte", () => {
    const satis = OLAYLAR.find((o) => o.anahtar === "Purchase");
    expect(satis?.oncelik).toBe(1);
  });

  it("olay adları Meta'nın standart adları (İngilizce ve büyük harfle başlıyor)", () => {
    // Türkçeleştirilseydi hepsi "özel olay" sayılır ve reklam
    // optimizasyonunda kullanılamazlardı.
    for (const o of OLAYLAR) expect(o.anahtar).toMatch(/^[A-Z][A-Za-z]+$/);
  });
});
