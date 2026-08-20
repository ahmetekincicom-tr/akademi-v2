import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GenelBakisIskeleti from "@/app/panel/loading";
import BirebirIskeleti from "@/app/panel/birebir-egitim/loading";
import OgrencilerIskeleti from "@/app/kontrol-9f4x2k/(protected)/ogrenciler/loading";

/**
 * İskelet ekranların gerçekten iskelet ürettiğini doğrular.
 *
 * Bu testin sebebi: loading.tsx sessizce bozulabilen bir dosya. Boş bir şey
 * döndürse ya da hiç çizilmese kimse fark etmez — kullanıcı yine beyaz
 * ekran görür ve bunu "sayfa yavaş" diye okur, "iskelet çalışmıyor" diye
 * değil. Görsel olmayan bir hata, görsel bir belirtiyle ortaya çıkıyor.
 *
 * Bileşenler saf sunucu bileşeni ve veri okumuyor; doğrudan çizilebiliyorlar.
 */

const iskeletler = [
  ["genel bakış", GenelBakisIskeleti],
  ["birebir eğitim", BirebirIskeleti],
  ["öğrenciler", OgrencilerIskeleti],
] as const;

describe("yükleme iskeletleri", () => {
  for (const [ad, Bilesen] of iskeletler) {
    it(`${ad}: iskelet kutusu çiziyor`, () => {
      const html = renderToStaticMarkup(Bilesen());
      const kutuSayisi = (html.match(/class="iskelet/g) ?? []).length;

      // Tek tük kutu, iskeletin yanlışlıkla boşaldığı anlamına gelir.
      expect(kutuSayisi, `${ad} yalnızca ${kutuSayisi} kutu çizdi`).toBeGreaterThan(5);
    });

    it(`${ad}: ekran okuyucuya tek cümle söylüyor`, () => {
      const html = renderToStaticMarkup(Bilesen());

      // Sahte kutuların tek tek okunması işkence olurdu; hepsi gizli ve
      // sayfa seviyesinde tek bir "yükleniyor" duyurusu var.
      expect(html).toContain('role="status"');
      expect(html).toContain("Sayfa yükleniyor");
      expect(html).toContain('aria-hidden="true"');
    });
  }
});
