/**
 * Bildirim e-postalarının şablonu.
 *
 * Tasarım siteyle aynı dilde: ink başlık şeridi, brand mavisi vurgu, mono
 * üst etiket. Ama e-posta HTML'i web HTML'i değil:
 *
 * - Yerleşim TABLO ile. Outlook (Word motoru) flex ve grid'i hiç tanımıyor.
 * - Stiller SATIR İÇİ. Gmail <style> bloğunu kısmen, bazı istemciler hiç
 *   uygulamıyor.
 * - Sitenin özel yazı tipleri kullanılamıyor; e-postada @font-face güvenilir
 *   değil, sistem yazı tipi yığını kullanılıyor.
 * - Arka planlar açıkça veriliyor: karanlık moddaki istemciler renk vermeyen
 *   alanları kendileri koyulaştırıp metni okunmaz hale getiriyor.
 */

const INK = "#0A0D18";
const BRAND = "#1C56F3";
const PAPER = "#F5F6FA";
const GRI = "#5C6273";
const KENAR = "#E4E7F0";

const YAZI = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type BildirimSatiri = { etiket: string; deger: string };

export type BildirimIcerigi = {
  /** Üstteki küçük mono etiket: "Yeni mesaj", "Danışmanlık talebi" gibi. */
  ustEtiket: string;
  baslik: string;
  /** Başlığın altındaki tek cümle. */
  ozet?: string;
  satirlar?: BildirimSatiri[];
  /** Kullanıcının yazdığı serbest metin; alıntı bloğunda gösteriliyor. */
  alinti?: string;
  eylem?: { etiket: string; adres: string };
  /** Tek kullanımlık doğrulama kodu; büyük ve seçilebilir biçimde basılıyor. */
  kod?: string;
  /**
   * Başlık şeridindeki ad. Yönetici bildirimleri "Akademi Yönetim" geçiyor;
   * öğrenciye giden mailler (auth, hoş geldin) varsayılanı kullanıyor —
   * şifresini sıfırlayan kişiye "yönetim paneli" demek yanlış olurdu.
   */
  marka?: string;
  /**
   * Başlık şeridindeki logo (mutlak adres). Verilmezse yazı işaretine
   * düşülüyor — mail hiçbir zaman logosuz görünmüyor.
   */
  logo?: string | null;
};

function kacir(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Şablonun hem HTML hem düz metin sürümünü birlikte üretir. */
export function bildirimSablonu(icerik: BildirimIcerigi): { html: string; metin: string } {
  return { html: html(icerik), metin: metin(icerik) };
}

function metin(i: BildirimIcerigi): string {
  const parcalar = [i.baslik];
  if (i.ozet) parcalar.push("", i.ozet);
  if (i.satirlar?.length) {
    parcalar.push("");
    for (const s of i.satirlar) parcalar.push(`${s.etiket}: ${s.deger}`);
  }
  if (i.kod) parcalar.push("", `Kod: ${i.kod}`);
  if (i.alinti) parcalar.push("", "---", i.alinti, "---");
  if (i.eylem) parcalar.push("", `${i.eylem.etiket}: ${i.eylem.adres}`);
  return parcalar.join("\n");
}

function satirlarHtml(satirlar: BildirimSatiri[]): string {
  return satirlar
    .map(
      (s, i) => `
      <tr>
        <td style="padding:${i === 0 ? "0" : "9px"} 14px 0 0;font:500 13px/1.5 ${YAZI};color:${GRI};white-space:nowrap;vertical-align:top">${kacir(s.etiket)}</td>
        <td style="padding:${i === 0 ? "0" : "9px"} 0 0 0;font:600 14px/1.5 ${YAZI};color:${INK};vertical-align:top">${kacir(s.deger)}</td>
      </tr>`,
    )
    .join("");
}

/**
 * Üst şerit: logo varsa logo, yoksa yazı işareti.
 *
 * Logo tek başına bırakılmıyor, yanında marka adı da yazılı kalıyor. Sebep
 * e-postaya özgü: istemcilerin çoğu uzak görselleri varsayılan olarak
 * engelliyor ve görsel çizilmediğinde şerit bomboş kalırdı. alt metni de
 * bu yüzden dolu — görsel engellendiğinde onun yerine o okunuyor.
 */
function baslikSeridi(i: BildirimIcerigi): string {
  const ad = kacir(i.marka ?? "Ahmet Ekinci Akademi");

  const isaret = i.logo
    ? `<img src="${kacir(i.logo)}" alt="${ad}" height="28" style="display:block;height:28px;width:auto;border:0;outline:none;text-decoration:none">`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${BRAND};border-radius:9px;width:32px;height:32px;text-align:center;font:700 14px/32px ${YAZI};color:#FFFFFF">AE</td></tr></table>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle">${isaret}</td>
            <td style="padding-left:11px;font:600 14px/1.2 ${YAZI};color:#FFFFFF;vertical-align:middle">${ad}</td>
          </tr></table>`;
}

function html(i: BildirimIcerigi): string {
  const govde: string[] = [];

  govde.push(
    `<div style="font:600 10px/1 ${YAZI};letter-spacing:.16em;text-transform:uppercase;color:${BRAND}">${kacir(i.ustEtiket)}</div>`,
    `<h1 style="margin:12px 0 0;font:600 22px/1.25 ${YAZI};letter-spacing:-.02em;color:${INK}">${kacir(i.baslik)}</h1>`,
  );

  if (i.ozet) {
    govde.push(
      `<p style="margin:10px 0 0;font:400 15px/1.6 ${YAZI};color:${GRI}">${kacir(i.ozet)}</p>`,
    );
  }

  if (i.satirlar?.length) {
    govde.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;border-collapse:collapse">${satirlarHtml(i.satirlar)}</table>`,
    );
  }

  if (i.kod) {
    /*
      Kod metin olarak basılıyor, görsel olarak değil: e-postada görsel
      engellenebiliyor ve kodu kopyalayamayan kişi giriş yapamaz. Harf aralığı
      da bu yüzden karakter karakter okunacak kadar açık.
    */
    govde.push(
      `<div style="margin-top:22px;padding:18px;background:${PAPER};border:1px solid ${KENAR};border-radius:12px;text-align:center;font:700 28px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.22em;color:${INK}">${kacir(i.kod)}</div>`,
    );
  }

  if (i.alinti) {
    // Satır sonları korunuyor: gelen mesajın biçimi bilginin bir parçası.
    const metinBloku = kacir(i.alinti).replace(/\n/g, "<br>");
    govde.push(
      `<div style="margin-top:22px;padding:16px 18px;background:${PAPER};border-left:3px solid ${BRAND};border-radius:0 10px 10px 0;font:400 14px/1.65 ${YAZI};color:${INK}">${metinBloku}</div>`,
    );
  }

  if (i.eylem) {
    govde.push(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px">
        <tr><td style="background:${INK};border-radius:10px">
          <a href="${kacir(i.eylem.adres)}" style="display:inline-block;padding:12px 22px;font:600 14px/1 ${YAZI};color:#FFFFFF;text-decoration:none">${kacir(i.eylem.etiket)}</a>
        </td></tr>
      </table>`);
  }

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${kacir(i.baslik)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};padding:28px 14px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${KENAR};border-radius:16px;overflow:hidden">

        <tr><td style="background:${INK};padding:18px 26px">${baslikSeridi(i)}</td></tr>

        <tr><td style="padding:28px 26px 30px">${govde.join("")}</td></tr>

      </table>

      <p style="max-width:560px;margin:16px auto 0;font:400 12px/1.6 ${YAZI};color:#8A90A0;text-align:center">
        Ahmet Ekinci Akademi &middot; bu e-posta otomatik gönderildi.
      </p>
    </td></tr>
  </table>
</body></html>`;
}
