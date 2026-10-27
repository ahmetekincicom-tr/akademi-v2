import { describe, expect, it } from "vitest";
import { blogHtmlTemizle, guvenliAdres } from "./blog-temizle";

describe("blogHtmlTemizle", () => {
  it("script, style ve olay özniteliklerini atar", () => {
    const sonuc = blogHtmlTemizle(
      '<p onclick="x()">Merhaba<script>alert(1)</script></p><style>p{}</style><img src="/a.png" onerror="x()" alt="a">',
    );
    expect(sonuc).toBe('<p>Merhaba</p><img src="/a.png" alt="a">');
  });

  it("javascript: ve data: adreslerini düşürür, görünmez karakterle gizleneni de", () => {
    expect(blogHtmlTemizle('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(blogHtmlTemizle('<a href="java\tscript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(blogHtmlTemizle('<img src="data:image/svg+xml;base64,PHN2Zz4=" alt="">')).toBe("");
  });

  it("satır içi stili atar", () => {
    expect(blogHtmlTemizle('<p style="background:url(//x)">a</p>')).toBe("<p>a</p>");
  });

  it("tanınmayan etiketi söker ama metnini korur", () => {
    expect(blogHtmlTemizle('<p><font color="red">kırmızı</font> metin</p>')).toBe("<p>kırmızı metin</p>");
  });

  it("gövdedeki H1'i H2'ye indirir", () => {
    expect(blogHtmlTemizle("<h1>Başlık</h1><h5>Alt</h5>")).toBe("<h2>Başlık</h2><h4>Alt</h4>");
  });

  it("yeni sekmede açılan dış bağlantıya noopener noreferrer ekler, sponsored beyanını korur", () => {
    expect(blogHtmlTemizle('<a href="https://ornek.com" target="_blank" rel="sponsored external">x</a>')).toBe(
      '<a href="https://ornek.com" target="_blank" rel="noopener noreferrer sponsored">x</a>',
    );
    // Kendi alan adımız mutlak yazılmış olsa da iç bağlantı.
    expect(blogHtmlTemizle('<a href="https://ahmetekinciakademi.com/x/" target="_blank">x</a>')).toBe(
      '<a href="https://ahmetekinciakademi.com/x/" target="_blank" rel="noopener">x</a>',
    );
    // Aynı sekmede: beyan dışı rel atılıyor, nofollow kalıyor.
    expect(blogHtmlTemizle('<a href="https://ornek.com" rel="external nofollow">x</a>')).toBe(
      '<a href="https://ornek.com" rel="nofollow">x</a>',
    );
    expect(blogHtmlTemizle('<a href="/egitimler/" target="_self">x</a>')).toBe('<a href="/egitimler/">x</a>');
  });

  it("yalnız YouTube/Vimeo gömmesine izin verir", () => {
    expect(blogHtmlTemizle('<iframe src="https://kotu.example/x"></iframe>')).toBe("");
    expect(blogHtmlTemizle('<iframe src="https://www.youtube.com/embed/abc" srcdoc="<b>"></iframe>')).toBe(
      '<iframe src="https://www.youtube.com/embed/abc" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
    );
  });

  it("editör bloklarını olduğu gibi geçirir", () => {
    const bilgi =
      '<aside class="aea-blok aea-blok--info" data-blok="info"><div class="aea-blok__ust"><span class="aea-blok__ikon" aria-hidden="true"></span><span class="aea-blok__etiket">Bilgi</span></div><div class="aea-blok__govde"><p>Not</p></div></aside>';
    expect(blogHtmlTemizle(bilgi)).toBe(bilgi);

    const gorsel =
      '<figure class="blog-figur" data-gorsel=""><img src="/dosya/kapaklar/blog/a.webp" alt="Açıklama" class="blog-gorsel" loading="lazy" decoding="async" width="1200" height="800" data-lightbox="1"><figcaption class="blog-figcaption">Alt yazı</figcaption></figure>';
    expect(blogHtmlTemizle(gorsel)).toBe(gorsel);

    const prompt =
      '<aside class="aea-blok aea-blok--prompt" data-blok="prompt"><div class="aea-blok__ust"><span class="aea-blok__ikon" aria-hidden="true"></span><span class="aea-blok__etiket">Örnek Prompt</span><button class="aea-prompt__kopyala" type="button" aria-label="Prompt metnini kopyala" data-kopyala="">Kopyala</button></div><pre class="aea-prompt__metin">metin</pre></aside>';
    expect(blogHtmlTemizle(prompt)).toBe(prompt);
  });

  it("editörün düzenleme işaretini (contenteditable) yayına taşımaz", () => {
    expect(blogHtmlTemizle('<div class="aea-blok__ust" contenteditable="false">x</div>')).toBe(
      '<div class="aea-blok__ust">x</div>',
    );
  });

  it("boş girdi boş döner", () => {
    expect(blogHtmlTemizle("")).toBe("");
    expect(blogHtmlTemizle("   ")).toBe("");
  });
});

describe("guvenliAdres", () => {
  it("göreli, http(s), mailto ve tel geçer", () => {
    for (const a of ["/a/", "#bolum", "./x", "https://a.com", "http://a.com", "//a.com/x"]) {
      expect(guvenliAdres(a, "src")).toBe(true);
    }
    expect(guvenliAdres("mailto:a@b.com", "href")).toBe(true);
    expect(guvenliAdres("tel:+90850", "href")).toBe(true);
  });

  it("mailto görselde, javascript: ve vbscript: hiçbir yerde geçmez", () => {
    expect(guvenliAdres("mailto:a@b.com", "src")).toBe(false);
    expect(guvenliAdres("javascript:x", "href")).toBe(false);
    expect(guvenliAdres(" JAVASCRIPT:x", "href")).toBe(false);
    expect(guvenliAdres("vbscript:x", "href")).toBe(false);
    expect(guvenliAdres("", "href")).toBe(false);
  });
});

describe("blogHtmlTemizle + bağlantı çözücü", () => {
  it("iç bağlantıyı son adrese yazar, kaldırılmışı metne çevirir", () => {
    const coz = (h: string) => (h === "/eski/" ? "/yeni/" : h === "/silinen/" ? null : h);
    expect(blogHtmlTemizle('<p><a href="/eski/">a</a> <a href="/silinen/"><strong>b</strong></a></p>', { baglanti: coz })).toBe(
      '<p><a href="/yeni/">a</a> <strong>b</strong></p>',
    );
  });
});
