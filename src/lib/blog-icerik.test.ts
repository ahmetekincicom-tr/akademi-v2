import { describe, expect, it } from "vitest";
import { iceriktenIcindekiler } from "@/lib/blog-icerik";

describe("iceriktenIcindekiler", () => {
  it("H2/H3 başlıklarına id ekler ve listeyi çıkarır", () => {
    const html = "<h2>Giriş</h2><p>metin</p><h3>Alt başlık</h3>";
    const { html: yeni, icindekiler } = iceriktenIcindekiler(html);
    expect(icindekiler).toEqual([
      { id: "giris", metin: "Giriş", seviye: 2 },
      { id: "alt-baslik", metin: "Alt başlık", seviye: 3 },
    ]);
    expect(yeni).toContain('<h2 id="giris">Giriş</h2>');
    expect(yeni).toContain('<h3 id="alt-baslik">Alt başlık</h3>');
  });

  it("başlık içindeki etiketleri metinden ayıklar", () => {
    const { icindekiler } = iceriktenIcindekiler("<h2>Meta <strong>Business</strong> Suite</h2>");
    expect(icindekiler[0].metin).toBe("Meta Business Suite");
    expect(icindekiler[0].id).toBe("meta-business-suite");
  });

  it("aynı başlık iki kez geçerse id benzersizleşir", () => {
    const { icindekiler } = iceriktenIcindekiler("<h2>Özet</h2><h2>Özet</h2>");
    expect(icindekiler.map((i) => i.id)).toEqual(["ozet", "ozet-2"]);
  });

  it("H4 ve paragrafları içindekilere almaz", () => {
    const { icindekiler } = iceriktenIcindekiler("<h4>Küçük</h4><p>Paragraf</p>");
    expect(icindekiler).toHaveLength(0);
  });
});
