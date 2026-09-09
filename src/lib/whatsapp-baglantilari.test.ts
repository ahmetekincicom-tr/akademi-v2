import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * WhatsApp düğmeleri next/link ile sarılmamalı.
 *
 * /git/whatsapp uygulamanın bir sayfası değil; WhatsApp'a çıkan bir ara
 * durak. <Link> ile sarıldığında Next bunu kendi içinde bir gezinme sanıp
 * adresi istemci tarafında çözmeye çalışıyor ve telefon o sırayı "kullanıcı
 * bir bağlantıya bastı" saymadığı için WhatsApp uygulamada değil tarayıcıda,
 * "sohbete devam et" ara sayfasıyla açılıyor. Kişi WhatsApp'a ulaşmak için
 * fazladan bir düğmeye daha basmak zorunda kalıyor.
 *
 * Bu bir kez yaşandı (eğitim detayındaki iki düğme) ve gözle fark edilmesi
 * zor: masaüstünde ikisi de çalışıyor gibi görünüyor, fark yalnızca telefonda
 * ortaya çıkıyor. Bu yüzden kural koda bağlandı.
 */

const KOK = join(process.cwd(), "src");

function tsxDosyalari(dizin: string): string[] {
  const cikti: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) {
      cikti.push(...tsxDosyalari(tam));
    } else if (tam.endsWith(".tsx")) {
      cikti.push(tam);
    }
  }
  return cikti;
}

/**
 * Verilen etiketin AÇILIŞ bölümlerini döndürür: "<a" ile onu kapatan ilk
 * ">" arasındaki metin.
 *
 * Geriye doğru "en yakın < neydi" diye bakmak yetmiyordu: WhatsApp adresi
 * bazı yerlerde JSX içinde değil, önce bir dizide kuruluyor (footer,
 * iletişim). Orada geriye bakınca alakasız bir etikete — hatta bir açıklama
 * satırındaki <Link> sözüne — çarpıp yanlış uyarı veriyordu. İleri doğru ve
 * yalnızca açılış etiketinin içine bakmak, sorulan şeyin tam karşılığı:
 * "bu adres bu etiketin bir özelliği olarak mı yazılmış?"
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
  const dosyalar = tsxDosyalari(KOK).map((yol) => ({
    yol: yol.replace(`${process.cwd()}/`, ""),
    kaynak: readFileSync(yol, "utf8"),
  }));

  it("hiçbiri next/link ile sarılmamış", () => {
    const kusurlu = dosyalar
      .filter(({ kaynak }) =>
        acilisEtiketleri(kaynak, "Link").some((etiket) => etiket.includes("olculenWhatsapp(")),
      )
      .map(({ yol }) => yol);

    expect(kusurlu).toEqual([]);
  });

  it("düğme olarak yazılanlar düz <a> ile yazılmış", () => {
    /*
      Tarama gerçekten bir şey buluyor mu? Bulmuyorsa yukarıdaki test boş
      kümeyi doğrulayıp sessizce geçer ve koruma diye bir şey kalmaz. Eşik
      bugünkü sayıdan (4) düşük değil.
    */
    const sayac = dosyalar.reduce(
      (t, { kaynak }) =>
        t + acilisEtiketleri(kaynak, "a").filter((e) => e.includes("olculenWhatsapp(")).length,
      0,
    );
    expect(sayac).toBeGreaterThanOrEqual(4);
  });
});
