import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * WhatsApp düğmeleri DOĞRUDAN wa.me'ye gitmeli.
 *
 * Bu kural iki kez ihlal edildi ve ikisi de gözle yakalanamadı, çünkü
 * masaüstünde her şey çalışıyor gibi görünüyor:
 *
 *  1. Düğmeler next/link ile sarılmıştı; telefon WhatsApp'ı uygulamada değil
 *     tarayıcıda açıyordu.
 *  2. Düğmeler kendi sunucumuzdaki bir ara duraktan (/git/whatsapp) geçip
 *     oradan wa.me'ye yönlendiriliyordu. iOS, başka bir alan adından gelen
 *     yönlendirmeyle wa.me'ye düşüldüğünde uygulamayı AÇMIYOR — "sohbete
 *     devam et" web sayfasını gösteriyor. Üstelik yönlendirme bekletiyordu.
 *
 * Bugünkü kural: sitedeki her WhatsApp düğmesi WhatsAppBaglantisi bileşeniyle
 * çiziliyor; o bileşen href'i doğrudan wa.me olarak veriyor ve tıklamayı ayrı
 * bir işaretle kaydediyor.
 */

const KOK = join(process.cwd(), "src");

/** Kuralın kendisini tanımlayan dosyalar; kendi kendilerini ihlal edemezler. */
const MUAF = [
  "src/components/site/WhatsAppBaglantisi.tsx",
  // Eski yönlendirme ucu: WordPress'teki sayfalar hâlâ bu adresi kullanıyor.
  "src/app/git/whatsapp/route.ts",
];

/**
 * Kural ZİYARETÇİYE GÖSTERİLEN düğmeler için.
 *
 * Yönetim panelindeki WhatsApp bağlantıları öğrencinin KENDİ numarasına
 * gidiyor: bir pazarlama düğmesi değil, yöneticinin elindeki bir iletişim
 * kısayolu. Orada ne takip kodu anlamlı ne de Contact olayı.
 */
function yonetimDosyasi(yol: string): boolean {
  return yol.startsWith("src/components/admin/") || yol.startsWith("src/app/kontrol-");
}

function kaynakDosyalari(dizin: string): string[] {
  const cikti: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) cikti.push(...kaynakDosyalari(tam));
    else if (tam.endsWith(".tsx") || tam.endsWith(".ts")) cikti.push(tam);
  }
  return cikti;
}

/**
 * Verilen etiketin AÇILIŞ bölümleri: "<a" ile onu kapatan ilk ">" arası.
 *
 * İleri doğru ve yalnızca açılış etiketinin içine bakılıyor. Geriye doğru "en
 * yakın < neydi" diye bakmak yanlış sonuç veriyordu: adresler bazı yerlerde
 * JSX içinde değil önce bir dizide kuruluyor, orada geriye bakınca alakasız
 * bir etikete — hatta bir açıklama satırındaki <Link> sözüne — çarpılıyordu.
 */
function acilisEtiketleri(kaynak: string, etiket: string): string[] {
  const cikti: string[] = [];
  const desen = new RegExp(`<${etiket}(?=[\\s/>])`, "g");
  let eslesme: RegExpExecArray | null;
  while ((eslesme = desen.exec(kaynak)) !== null) {
    const kapanis = kaynak.indexOf(">", eslesme.index);
    if (kapanis === -1) continue;
    cikti.push(kaynak.slice(eslesme.index, kapanis));
  }
  return cikti;
}

describe("WhatsApp bağlantıları", () => {
  const dosyalar = kaynakDosyalari(KOK)
    .map((yol) => ({ yol: yol.replace(`${process.cwd()}/`, ""), kaynak: readFileSync(yol, "utf8") }))
    .filter(({ yol }) => !yol.endsWith(".test.ts") && !yol.endsWith(".test.tsx"));

  const kuralaTabi = dosyalar.filter(({ yol }) => !MUAF.includes(yol) && !yonetimDosyasi(yol));

  it("hiçbir wa.me adresi elle bir etiketin içine yazılmamış", () => {
    /*
      Elle yazılmış bir wa.me adresi, tıklamanın hiç kaydedilmemesi demek —
      ve bunu fark etmek imkânsıza yakın, çünkü düğme gayet çalışıyor.
    */
    const kusurlu = kuralaTabi
      .filter(({ kaynak }) =>
        ["a", "Link"].some((e) => acilisEtiketleri(kaynak, e).some((t) => t.includes("wa.me"))),
      )
      .map(({ yol }) => yol);

    expect(kusurlu).toEqual([]);
  });

  it("hiçbir düğme eski yönlendirme ucuna bağlanmıyor", () => {
    // /git/whatsapp yalnızca WordPress için duruyor; bu sitenin düğmeleri
    // oradan geçmemeli, yoksa telefonda uygulama yerine web sayfası açılır.
    const kusurlu = kuralaTabi
      // Yalnızca GERÇEK adresler: tırnak içinde geçenler. Açıklama
      // satırlarında bu yoldan söz etmek serbest.
      .filter(({ kaynak }) => /["'`]\/git\/whatsapp/.test(kaynak))
      .map(({ yol }) => yol);

    expect(kusurlu).toEqual([]);
  });

  it("WhatsApp düğmeleri paylaşılan bileşenle çiziliyor", () => {
    /*
      Tarama gerçekten bir şey buluyor mu? Bulmuyorsa yukarıdaki iki test boş
      kümeyi doğrulayıp sessizce geçer ve koruma diye bir şey kalmaz. Eşik
      bugünkü sayıdan (6 kullanım yeri) düşük değil.
    */
    const sayac = kuralaTabi.reduce(
      (t, { kaynak }) => t + acilisEtiketleri(kaynak, "WhatsAppBaglantisi").length,
      0,
    );
    expect(sayac).toBeGreaterThanOrEqual(6);
  });
});
