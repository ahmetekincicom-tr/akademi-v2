import { describe, expect, it } from "vitest";
import { sssCikar, yaziSss } from "./blog-sss";
import { blogHtmlTemizle } from "./blog-temizle";
import { iceriktenIcindekiler } from "./blog-icerik";

// Editörün ürettiği işaretleme (tiptap/SssButonTablo).
const madde = (s: string, c: string) =>
  `<div class="aea-sss__madde" data-sss-madde=""><h3 class="aea-sss__soru" data-sss-soru="">${s}</h3><div class="aea-sss__cevap" data-sss-cevap="">${c}</div></div>`;
const SSS =
  '<section class="aea-sss" data-blok="sss"><h2>Sıkça Sorulan Sorular</h2>' +
  madde("Eğitim kaç saat?", "<p>Toplam <strong>12</strong> saat.</p>") +
  madde("Kayıtlar izlenebilir mi?", "<ul><li>Evet,</li><li>süresiz.</li></ul>") +
  "</section>";

describe("sssCikar / yaziSss", () => {
  it("soru ve düz metin cevapları sırayla çıkar", () => {
    expect(sssCikar(SSS)).toEqual([
      { soru: "Eğitim kaç saat?", cevap: "Toplam 12 saat." },
      { soru: "Kayıtlar izlenebilir mi?", cevap: "Evet, süresiz." },
    ]);
  });

  it("boş soru ya da boş cevap atlanır; tek soruluk blok FAQPage'e girmez", () => {
    const tek = `<section data-blok="sss"><h2>SSS</h2>${madde("Soru?", "<p>Cevap</p>")}${madde("", "<p>x</p>")}${madde("Cevapsız?", "<p></p>")}</section>`;
    expect(sssCikar(tek)).toEqual([{ soru: "Soru?", cevap: "Cevap" }]);
    expect(yaziSss(tek)).toEqual([]);
    expect(yaziSss(SSS)).toHaveLength(2);
  });

  it("SSS bloğu yoksa boş", () => {
    expect(sssCikar("<h2>Başlık</h2><p>metin</p>")).toEqual([]);
  });
});

describe("blogHtmlTemizle — SSS, buton, tablo", () => {
  it("SSS işaretlemesi temizlikten değişmeden geçer", () => {
    expect(blogHtmlTemizle(SSS)).toBe(SSS);
  });

  it("buton korunur; bağlantısı ya da metni olmayan buton kalkar", () => {
    const b = '<p class="aea-buton" data-blok="buton"><a href="/egitimler/" data-buton="">Eğitimi incele</a></p>';
    expect(blogHtmlTemizle(b)).toBe(b);
    expect(blogHtmlTemizle('<p class="aea-buton" data-blok="buton"><a href="/egitimler/" data-buton=""></a></p>')).toBe("");
    expect(blogHtmlTemizle('<p class="aea-buton" data-blok="buton"><a href="javascript:alert(1)" data-buton="">x</a></p>')).toBe("");
  });

  it("kaldırılmış hedefe giden buton (çözücü null) kalkar", () => {
    const b = '<p data-blok="buton"><a href="/eski/" data-buton="">Git</a></p>';
    expect(blogHtmlTemizle(b, { baglanti: () => null })).toBe("");
  });

  it("tablo kaydırma kutusuna sarılır, tümü th olan ilk satır thead'e taşınır", () => {
    const t = "<table><tbody><tr><th><p>A</p></th><th><p>B</p></th></tr><tr><td><p>1</p></td><td><p>2</p></td></tr></tbody></table>";
    expect(blogHtmlTemizle(t)).toBe(
      '<div class="aea-tablo" role="region" tabindex="0" aria-label="Tablo"><table><thead><tr><th><p>A</p></th><th><p>B</p></th></tr></thead><tbody><tr><td><p>1</p></td><td><p>2</p></td></tr></tbody></table></div>',
    );
  });

  it("thead'i olan ya da başlık satırı olmayan tablo yalnız sarılır; colgroup ve stil atılır", () => {
    const t = '<table style="min-width:75px"><colgroup><col style="min-width:25px"></colgroup><tbody><tr><td><p>1</p></td></tr></tbody></table>';
    expect(blogHtmlTemizle(t)).toBe(
      '<div class="aea-tablo" role="region" tabindex="0" aria-label="Tablo"><table><tbody><tr><td><p>1</p></td></tr></tbody></table></div>',
    );
  });
});

describe("İçindekiler — SSS", () => {
  it("bölüm başlığı girer, sorular girmez", () => {
    const { icindekiler } = iceriktenIcindekiler(`<h2>Giriş</h2><p>a</p>${SSS}`);
    expect(icindekiler.map((i) => i.metin)).toEqual(["Giriş", "Sıkça Sorulan Sorular"]);
  });
});

describe("blogHtmlTemizle — boş başlık", () => {
  it("metni olmayan başlık atılır, görselli başlık kalır", () => {
    expect(blogHtmlTemizle("<h2></h2><h2> &nbsp; </h2><p>a</p><h3><strong></strong></h3>")).toBe("<p>a</p>");
    expect(blogHtmlTemizle('<h2><img src="/a.png" alt="x"></h2>')).toBe('<h2><img src="/a.png" alt="x"></h2>');
  });
});
