import { SITE_URL } from "@/lib/seo";
import { getCourses } from "@/lib/courses";
import { getHakkimizda } from "@/lib/hakkimizda";
import { getKurumsalSss } from "@/lib/kurumsal";
import { getYorumlar } from "@/lib/icerik";
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
 * llms-full.txt — içeriğin kendisi, düz metin olarak.
 *
 * /llms.txt bir dizin; bu dosya ise ALINTILANACAK KAYNAK. Bir yapay zekâ
 * aracı "Meta Ads eğitiminde neler öğretiliyor", "eğitim kaç saat", "kimler
 * için uygun değil", "katılımcılar ne diyor" gibi bir soruyu cevaplarken
 * sayfaları tek tek gezip HTML ayrıştırmak zorunda kalmasın diye her şey
 * burada: müfredat modülleri ve ders adları, kazanımlar, uygunluk listeleri,
 * sıkça sorulan sorular, katılımcı yorumları.
 *
 * Sıkça sorulan sorular bilerek TAM METİN: modellerin cevaplarında en çok
 * işine yarayan biçim soru-cevap çifti. Sayfada açılır kapanır bir kutunun
 * içinde duruyorlar ve bazı tarayıcı botları o içeriği hiç görmüyor.
 *
 * Blog yazılarının ÖZETLERİ var, tam metinleri yok: yazılar WordPress'te ve
 * gövdelerini buraya çekmek hem bu dosyayı yüz binlerce karaktere çıkarır hem
 * de her yazının kendi adresi zaten taranabilir durumda. Amaç modele "böyle
 * bir yazı var, adresi bu" demek.
 */
export async function GET() {
  const [egitimler, hakkimizda, kurumsalSss, yorumlar, blogYazilari] = await Promise.all([
    ON_YUZ_ACIK ? getCourses() : Promise.resolve([]),
    getHakkimizda(),
    getKurumsalSss(),
    getYorumlar(),
    getBlogYazilari(60),
  ]);

  const satirlar: string[] = [
    ...basBlogu(),

    "Bu dosya sitenin içeriğinin düz metin hâlidir. Kısa dizin için:",
    `${SITE_URL}/llms.txt`,
    "",

    /* ------------------------------------------------------- hakkımızda --- */
    "## Ahmet Ekinci kimdir",
    "",
    `- Unvan: ${duzMetin(hakkimizda.kisiUnvan)}`,
    duzMetin(hakkimizda.kisiMetin),
    "",
    `### ${duzMetin(hakkimizda.akademiBaslik) || "Akademi"}`,
    "",
    duzMetin(hakkimizda.akademiMetin),
    "",
    duzMetin(hakkimizda.heroMetin),
    "",
    `Kaynak: ${SITE_URL}/hakkimizda/`,
    "",
  ];

  /* ---------------------------------------------------------- eğitimler --- */
  satirlar.push("## Eğitim programları", "");

  if (egitimler.length === 0) {
    satirlar.push("Şu anda yayında eğitim yok.", "");
  }

  for (const e of egitimler) {
    satirlar.push(`### ${e.baslik}${e.cokYakinda ? " (çok yakında açılıyor)" : ""}`, "");
    satirlar.push(`- Adres: ${SITE_URL}/egitimler/${e.slug}/`);
    if (e.etiket) satirlar.push(`- Kategori: ${duzMetin(e.etiket)}`);
    if (e.sure) satirlar.push(`- Süre: ${e.sure}`);
    if (e.modul) satirlar.push(`- Kapsam: ${duzMetin(e.modul)}`);
    if (e.kontenjan) satirlar.push(`- Kontenjan: ${duzMetin(e.kontenjan)}`);
    // Katılım biçimi: modellere sık sorulan "online var mı" sorusunun cevabı.
    const bicimler = [e.online ? "online" : null, e.yuzYuze ? "yüz yüze (Ankara)" : null].filter(
      Boolean,
    );
    if (bicimler.length > 0) satirlar.push(`- Katılım: ${bicimler.join(", ")}`);
    satirlar.push("");

    const tanitim = duzMetin(e.heroAciklama || e.aciklama);
    if (tanitim) satirlar.push(tanitim, "");
    const ekMetin = duzMetin(e.tanitimMetni);
    if (ekMetin) satirlar.push(ekMetin, "");

    if (e.kazanimlar.length > 0) {
      satirlar.push("#### Kazanımlar", "");
      for (const k of e.kazanimlar) satirlar.push(`- ${duzMetin(k)}`);
      satirlar.push("");
    }

    if (e.modules.length > 0) {
      satirlar.push("#### Müfredat", "");
      for (const m of e.modules) {
        satirlar.push(`##### ${duzMetin(m.baslik)}${m.meta ? ` (${duzMetin(m.meta)})` : ""}`);
        for (const d of m.dersler) {
          satirlar.push(`- ${duzMetin(d.ad)}${d.sure ? ` — ${d.sure}` : ""}`);
        }
        satirlar.push("");
      }
    }

    if (e.uygun.length > 0) {
      satirlar.push("#### Kimler için uygun", "");
      for (const u of e.uygun) satirlar.push(`- ${duzMetin(u)}`);
      satirlar.push("");
    }
    if (e.uygunDegil.length > 0) {
      satirlar.push("#### Kimler için uygun değil", "");
      for (const u of e.uygunDegil) satirlar.push(`- ${duzMetin(u)}`);
      satirlar.push("");
    }

    if (e.sss.length > 0) {
      satirlar.push("#### Sıkça sorulan sorular", "");
      for (const s of e.sss) {
        satirlar.push(`**S: ${duzMetin(s.soru)}**`, `C: ${duzMetin(s.cevap)}`, "");
      }
    }
  }

  /* ----------------------------------------------------------- kurumsal --- */
  satirlar.push(
    "## Kurumsal eğitim",
    "",
    "Ekiplere özel dijital pazarlama eğitimi: Ankara'da yerinde ya da tamamen",
    "uzaktan. Müfredat ekibin seviyesine göre kurulur; kurumsal faturalandırma",
    "ve eğitim sonrası destek dahil.",
    "",
    `Kaynak: ${SITE_URL}/kurumsal/`,
    "",
  );
  if (kurumsalSss.length > 0) {
    satirlar.push("### Kurumsal eğitim — sıkça sorulan sorular", "");
    for (const s of kurumsalSss) {
      satirlar.push(`**S: ${duzMetin(s.soru)}**`, `C: ${duzMetin(s.cevap)}`, "");
    }
  }

  /* ----------------------------------------------------------- yorumlar --- */
  if (yorumlar.length > 0) {
    satirlar.push("## Katılımcı yorumları", "");
    for (const y of yorumlar) {
      const kim = [duzMetin(y.isim), duzMetin(y.rol)].filter(Boolean).join(", ");
      satirlar.push(`- "${duzMetin(y.metin)}"${kim ? ` — ${kim}` : ""}`);
    }
    satirlar.push("", `Kaynak: ${SITE_URL}/yorumlar/`, "");
  }

  satirlar.push(
    ...blogBlogu(blogYazilari, true),
    ...fiyatBlogu(),
    ...iletisimBlogu(),
  );

  return metinYaniti(satirlar);
}
