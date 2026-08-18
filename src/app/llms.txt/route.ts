import { SITE_URL, SITE_ADI, VARSAYILAN_ACIKLAMA } from "@/lib/seo";
import { getCourses } from "@/lib/courses";
import { EPOSTA, INSTAGRAM_URL, OFIS_ADRESI, WHATSAPP_NUMARALAR } from "@/lib/iletisim";
import { ON_YUZ_ACIK } from "@/proxy";

// Eğitimler panelden değişiyor; dosya istek anında üretiliyor ki liste
// gerçekle uyumsuz kalmasın.
export const dynamic = "force-dynamic";

/**
 * llms.txt — yapay zekâ arama motorları için özet (llmstxt.org).
 *
 * ChatGPT, Perplexity ve benzerleri bir siteyi kaynak gösterirken önce ne
 * olduğunu anlamak zorunda. Sayfaları tek tek okuyup çıkarım yapmak yerine
 * burada düz metin olarak veriliyor: kim, ne yapıyor, hangi programlar var,
 * nereden ulaşılır. HTML ayrıştırmaya, JavaScript çalıştırmaya gerek yok.
 *
 * Statik bir dosya değil çünkü eğitim listesi veritabanından geliyor —
 * public/ altına konsaydı ilk yeniden adlandırmada yanlış bilgi verirdi.
 */
export async function GET() {
  // Ön yüz kapalıyken tanıtım sayfaları sunulmuyor; hepsi panel girişine
  // yönlendiriliyor. Yönlendirilen adresleri burada saymak yapay zekâ arama
  // motoruna okuyamayacağı bağlantılar vermek olur.
  const egitimler = ON_YUZ_ACIK ? await getCourses() : [];

  const satirlar = [
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
    "## Eğitimler",
    "",
    ...(!ON_YUZ_ACIK
      ? [
          "Eğitimlerin tanıtım sayfaları şu an yayında değil; yenileniyor.",
          "Program bilgisi için iletişim kanalları aşağıda.",
          "",
        ]
      : []),
    ...(egitimler.length > 0
      ? egitimler.flatMap((e) => [
          `### ${e.baslik}`,
          `- Adres: ${SITE_URL}/egitimler/${e.slug}`,
          ...(e.sure ? [`- Süre: ${e.sure}`] : []),
          ...(e.aciklama ? [`- Özet: ${e.aciklama}`] : []),
          ...(e.kazanimlar.length > 0 ? [`- Kazanımlar: ${e.kazanimlar.join("; ")}`] : []),
          "",
        ])
      : ["Şu anda yayında eğitim yok.", ""]),
    "## Sayfalar",
    "",
    `- [Katılımcı paneli girişi](${SITE_URL}/giris)`,
    ...(ON_YUZ_ACIK
      ? [
          `- [Ana sayfa](${SITE_URL}/)`,
          `- [Eğitim programları](${SITE_URL}/egitimler)`,
          `- [Hakkımızda — Ahmet Ekinci kimdir](${SITE_URL}/hakkimizda)`,
          `- [Kurumsal eğitim](${SITE_URL}/kurumsal)`,
          `- [Referanslar](${SITE_URL}/referanslar)`,
          `- [Katılımcı yorumları](${SITE_URL}/yorumlar)`,
          `- [İletişim](${SITE_URL}/iletisim)`,
        ]
      : []),
    "",
    "## Fiyatlandırma",
    "",
    "Sabit liste fiyatı yok. Program kapsamı ve süresi katılımcının başlangıç",
    "seviyesine ve hedefine göre kurulduğu için fiyat ücretsiz ön görüşmeden",
    "sonra veriliyor. Ödeme kartla (tek çekim veya taksit) ya da havale ile.",
    "",
    "## İletişim",
    "",
    `- E-posta: ${EPOSTA}`,
    ...WHATSAPP_NUMARALAR.map((n) => `- WhatsApp: ${n.gosterim}`),
    `- Instagram: ${INSTAGRAM_URL}`,
    "",
  ];

  return new Response(satirlar.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Bir saat önbellek: içerik nadiren değişiyor, her botun istediğinde
      // veritabanına gitmesinin anlamı yok.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
