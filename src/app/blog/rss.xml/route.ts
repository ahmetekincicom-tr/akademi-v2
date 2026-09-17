import { getYayindakiYazilar } from "@/lib/yazilar";
import { SITE_URL, SITE_ADI } from "@/lib/seo";

// İçerik panelden değişiyor; saatlik tazeleniyor.
export const revalidate = 3600;

function kacir(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Blog RSS 2.0 akışı.
 *
 * Feed okuyucular ve bazı platformlar yeni yazıları buradan takip ediyor.
 * Yalnızca yayındaki yazılar; adresler sondaki eğik çizgiyle (trailingSlash).
 */
export async function GET() {
  const yazilar = await getYayindakiYazilar();
  const kanalAdres = `${SITE_URL}/blog/`;

  const ogeler = yazilar
    .map((y) => {
      const adres = `${SITE_URL}/blog/${y.slug}/`;
      const tarih = y.yayinTarihi ?? y.guncelleme;
      return `    <item>
      <title>${kacir(y.baslik)}</title>
      <link>${adres}</link>
      <guid isPermaLink="true">${adres}</guid>
      ${y.kategori ? `<category>${kacir(y.kategori.ad)}</category>` : ""}
      <pubDate>${new Date(tarih).toUTCString()}</pubDate>
      <description>${kacir(y.ozet)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${kacir(SITE_ADI)} — Blog</title>
    <link>${kanalAdres}</link>
    <description>Meta reklamları, sosyal medya ve dijital pazarlama üzerine yazılar.</description>
    <language>tr-TR</language>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${ogeler}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
