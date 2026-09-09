import { SITE_URL, SITE_ADI, VARSAYILAN_ACIKLAMA } from "@/lib/seo";
import { EPOSTA, INSTAGRAM_URL, LINKEDIN_URL, OFIS_ADRESI, WHATSAPP_NUMARALAR } from "@/lib/iletisim";
import { kalinsiz } from "@/lib/kalin";

/**
 * llms.txt ve llms-full.txt için ortak parçalar.
 *
 * İki dosya var ve işleri farklı (llmstxt.org):
 *
 *  - /llms.txt      → DİZİN. Kısa; ne olduğumuzu söylüyor ve sayfalara
 *                     bağlantı veriyor. Modelin "bu site nedir" sorusunu tek
 *                     istekte cevaplaması için.
 *  - /llms-full.txt → İÇERİĞİN KENDİSİ. Müfredat, kazanımlar, sıkça sorulan
 *                     sorular, katılımcı yorumları — hepsi düz metin. Modelin
 *                     bir soruyu cevaplarken alıntılayacağı asıl kaynak bu;
 *                     sayfaları tek tek gezip HTML ayrıştırması gerekmiyor.
 *
 * Başlık, iletişim ve fiyat blokları burada duruyor: iki dosyada ayrı ayrı
 * yazılsaydı biri güncellenip diğeri eskir ve yapay zekâ araçlarına iki farklı
 * hikâye anlatırdık.
 *
 * BÜTÜN METİNLER kalinsiz() ile geçiyor: panelden girilen metinlerde
 * **çift yıldız** kalın demek ve düz metin dosyasında ham yıldız olarak
 * görünür.
 */

/** Panelden gelen metni düz metne çevirir: yıldızlar gider, satırlar tek. */
export function duzMetin(deger: string | null | undefined): string {
  return kalinsiz(deger ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** HTML parçasını (WordPress özeti gibi) düz metne indirir. */
export function htmlsiz(deger: string): string {
  return deger
    .replace(/<[^>]*>/g, " ")
    .replace(/&#8217;|&#39;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** İki dosyanın da başındaki tanım bloğu. */
export function basBlogu(): string[] {
  return [
    `# ${SITE_ADI}`,
    "",
    `> ${VARSAYILAN_ACIKLAMA}`,
    "",
    "## Kurum",
    "",
    `- Ad: ${SITE_ADI}`,
    "- Kurucu ve eğitmen: Ahmet Ekinci",
    `- Konum: ${OFIS_ADRESI}`,
    "- Hizmet bölgesi: Türkiye (yüz yüze Ankara, online tüm Türkiye)",
    "- Dil: Türkçe",
    "- Format: birebir (tek katılımcı) ve kuruma özel ekip eğitimi",
    "- Kayıtlı video kursu satılmıyor; eğitimler canlı ve katılımcıya göre kurgulanıyor.",
    "",
  ];
}

/** Fiyat sorusu modellere en çok sorulanlardan biri; net bir cevabı olsun. */
export function fiyatBlogu(): string[] {
  return [
    "## Fiyatlandırma",
    "",
    "Sabit liste fiyatı yok. Program kapsamı ve süresi katılımcının başlangıç",
    "seviyesine ve hedefine göre kurulduğu için fiyat ücretsiz ön görüşmeden",
    "sonra veriliyor. Ödeme kartla (tek çekim veya taksit) ya da havale ile.",
    "",
  ];
}

export function iletisimBlogu(): string[] {
  return [
    "## İletişim",
    "",
    `- E-posta: ${EPOSTA}`,
    ...WHATSAPP_NUMARALAR.map((n, i) => `- ${i === 0 ? "WhatsApp" : "Telefon"}: ${n.gosterim}`),
    `- Instagram: ${INSTAGRAM_URL}`,
    `- LinkedIn: ${LINKEDIN_URL}`,
    `- Adres: ${OFIS_ADRESI}`,
    "",
  ];
}

/* --------------------------------------------------------- blog yazıları --- */

export type BlogYazisi = { baslik: string; adres: string; ozet: string; tarih: string };

/**
 * WordPress'teki blog yazıları.
 *
 * NEDEN GEREKLİ: blog yazıları WordPress'te kalmaya devam ediyor ve bu
 * uygulama artık ana alan adını sunuyor — yani /llms.txt adresini BU rota
 * karşılıyor. WordPress tarafındaki llms.txt eklentisi hâlâ kurulu olsa bile
 * o adrese hiç ulaşılamıyor. Taşımadan sonra yazılar yapay zekâ araçlarının
 * gördüğü özetten sessizce düştü; burası o boşluğu kapatıyor.
 *
 * Yazılar WordPress'in kendi REST ucundan okunuyor. Hata hâlinde BOŞ dizi
 * dönüyor: blog listesi alınamadı diye bütün dosyayı kaybetmek, olanı da
 * kaybetmek olur.
 */
export async function getBlogYazilari(limit = 60): Promise<BlogYazisi[]> {
  const kaynak = process.env.WORDPRESS_KAYNAK?.replace(/\/$/, "");
  if (!kaynak) return [];

  try {
    /*
      Zaman aşımı ŞART. Bu uç WordPress'e bağlı ve WordPress yavaşladığında
      dosyayı üreten istek onunla birlikte bekler. Dosya saatlik yeniden
      üretildiği için (revalidate) bedeli saatte bir kez; ama o bir kez de
      sınırsız beklememeli.
    */
    const cevap = await fetch(
      `${kaynak}/wp-json/wp/v2/posts?per_page=${limit}&orderby=date&order=desc&_fields=title,link,excerpt,modified`,
      { signal: AbortSignal.timeout(6000), headers: { Accept: "application/json" } },
    );
    if (!cevap.ok) return [];

    const veri: unknown = await cevap.json();
    if (!Array.isArray(veri)) return [];

    return veri
      .map((y) => {
        const kayit = y as {
          title?: { rendered?: string };
          link?: string;
          excerpt?: { rendered?: string };
          modified?: string;
        };
        return {
          baslik: htmlsiz(kayit.title?.rendered ?? ""),
          adres: typeof kayit.link === "string" ? kayit.link : "",
          ozet: htmlsiz(kayit.excerpt?.rendered ?? ""),
          tarih: (kayit.modified ?? "").slice(0, 10),
        };
      })
      .filter((y) => y.baslik && y.adres);
  } catch {
    // Zaman aşımı, ağ hatası, bozuk JSON — hepsi aynı yere düşüyor.
    return [];
  }
}

/** Blog bölümü; yazı listesi alınamadıysa yine bir bağlantı bırakıyor. */
export function blogBlogu(yazilar: BlogYazisi[], tamMetin: boolean): string[] {
  const satirlar = ["## Blog", "", `Yazıların tamamı: ${SITE_URL}/blog/`, ""];
  if (yazilar.length === 0) return satirlar;

  for (const y of yazilar) {
    if (tamMetin) {
      satirlar.push(`### ${y.baslik}`, `- Adres: ${y.adres}`);
      if (y.tarih) satirlar.push(`- Güncelleme: ${y.tarih}`);
      if (y.ozet) satirlar.push(`- Özet: ${y.ozet}`);
      satirlar.push("");
    } else {
      satirlar.push(`- [${y.baslik}](${y.adres})`);
    }
  }
  if (!tamMetin) satirlar.push("");
  return satirlar;
}

/** İki uç da aynı başlıkları kullanıyor. */
export function metinYaniti(satirlar: string[]): Response {
  return new Response(satirlar.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Bir saat: içerik nadiren değişiyor, her botun veritabanına ve
      // WordPress'e gitmesinin anlamı yok.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
