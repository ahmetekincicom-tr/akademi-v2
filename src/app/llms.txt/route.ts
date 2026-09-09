import { SITE_URL } from "@/lib/seo";
import { getCourses } from "@/lib/courses";
import { ON_YUZ_ACIK } from "@/proxy";
import {
  basBlogu,
  blogBlogu,
  duzMetin,
  fiyatBlogu,
  getBlogYazilari,
  iletisimBlogu,
  metinYaniti,
} from "@/lib/llms";

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

/**
 * llms.txt — yapay zekâ arama motorları için DİZİN (llmstxt.org).
 *
 * ChatGPT, Perplexity, Gemini ve Claude bir siteyi kaynak gösterirken önce ne
 * olduğunu anlamak zorunda. Sayfaları tek tek okuyup çıkarım yapmak yerine
 * burada düz metin olarak veriliyor: kim, ne yapıyor, hangi programlar var,
 * nereden ulaşılır. HTML ayrıştırmaya, JavaScript çalıştırmaya gerek yok.
 *
 * Bu dosya KISA tutuluyor — bir dizin olması gerekiyor. İçeriğin kendisi
 * (müfredat, sıkça sorulan sorular, yorumlar) /llms-full.txt içinde ve
 * buradan ona bağlantı veriliyor.
 *
 * Statik bir dosya değil çünkü eğitim listesi veritabanından, blog listesi de
 * WordPress'ten geliyor — public/ altına konsaydı ilk yeniden adlandırmada
 * yanlış bilgi verirdi.
 */
export async function GET() {
  // Ön yüz kapalıyken tanıtım sayfaları sunulmuyor; hepsi panel girişine
  // yönlendiriliyor. Yönlendirilen adresleri burada saymak yapay zekâ arama
  // motoruna okuyamayacağı bağlantılar vermek olur.
  const [egitimler, blogYazilari] = await Promise.all([
    ON_YUZ_ACIK ? getCourses() : Promise.resolve([]),
    getBlogYazilari(30),
  ]);

  const satirlar = [
    ...basBlogu(),

    "## Ayrıntılı içerik",
    "",
    `Bütün programların müfredatı, kazanımları, sıkça sorulan sorular ve`,
    `katılımcı yorumları tek dosyada: ${SITE_URL}/llms-full.txt`,
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
          `### ${e.baslik}${e.cokYakinda ? " (çok yakında)" : ""}`,
          `- Adres: ${SITE_URL}/egitimler/${e.slug}/`,
          ...(e.sure ? [`- Süre: ${e.sure}`] : []),
          ...(e.modul ? [`- Kapsam: ${duzMetin(e.modul)}`] : []),
          ...(e.aciklama ? [`- Özet: ${duzMetin(e.aciklama)}`] : []),
          "",
        ])
      : ["Şu anda yayında eğitim yok.", ""]),

    "## Sayfalar",
    "",
    `- [Katılımcı paneli girişi](${SITE_URL}/giris/)`,
    ...(ON_YUZ_ACIK
      ? [
          `- [Ana sayfa](${SITE_URL}/)`,
          `- [Eğitim programları](${SITE_URL}/egitimler/)`,
          `- [Hakkımızda — Ahmet Ekinci kimdir](${SITE_URL}/hakkimizda/)`,
          `- [Kurumsal eğitim](${SITE_URL}/kurumsal/)`,
          `- [Referanslar](${SITE_URL}/referanslar/)`,
          `- [Katılımcı yorumları](${SITE_URL}/yorumlar/)`,
          `- [İletişim](${SITE_URL}/iletisim/)`,
        ]
      : []),
    "",

    ...blogBlogu(blogYazilari, false),
    ...fiyatBlogu(),
    ...iletisimBlogu(),
  ];

  return metinYaniti(satirlar);
}
