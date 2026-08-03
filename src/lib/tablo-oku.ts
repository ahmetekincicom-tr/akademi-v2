/**
 * CSV ve XLSX okuma. Tarayıcıda çalışır, dış bağımlılık yok.
 *
 * Neden paket kullanmıyoruz: bu iş bir kere yapılacak bir içe aktarma için;
 * tablo okuyan paketler onlarca formatı destekliyor ve büyük bir yüzey
 * getiriyor. Bize gereken iki şey var — Excel'in kaydettiği CSV ve xlsx.
 *
 * Neden tarayıcıda: dosya sunucuya hiç gitmiyor. 400 satırlık kişisel veri
 * yüklemesinde ara duraklar azalsın; ayrıca yönetici içe aktarmadan önce
 * ekranda görüp doğrulayabiliyor.
 */

export type TabloSatiri = Record<string, string>;
export type TabloSonuc = { basliklar: string[]; satirlar: TabloSatiri[] };

/* ---------------------------------------------------------------- CSV --- */

/**
 * Excel'in Türkçe yerel ayarda kaydettiği CSV noktalı virgülle ayrılıyor,
 * "CSV UTF-8" seçeneği ise virgülle. Ayırıcıyı dayatmak yerine ölçüyoruz:
 * tırnak dışında kalan adayların ilk satırdaki sayısına bakılıyor.
 */
function ayiriciBul(metin: string): string {
  const satir = metin.split(/\r?\n/, 1)[0] ?? "";
  const adaylar = [";", ",", "\t"];
  let enIyi = ",";
  let enCok = 0;

  for (const a of adaylar) {
    let sayi = 0;
    let tirnakta = false;
    for (const ch of satir) {
      if (ch === '"') tirnakta = !tirnakta;
      else if (ch === a && !tirnakta) sayi++;
    }
    if (sayi > enCok) {
      enCok = sayi;
      enIyi = a;
    }
  }
  return enIyi;
}

function csvAyristir(metin: string): string[][] {
  const ayirici = ayiriciBul(metin);
  const satirlar: string[][] = [];
  let hucre = "";
  let satir: string[] = [];
  let tirnakta = false;

  for (let i = 0; i < metin.length; i++) {
    const ch = metin[i];

    if (tirnakta) {
      if (ch === '"') {
        // İki tırnak, kaçırılmış tek tırnak demek.
        if (metin[i + 1] === '"') {
          hucre += '"';
          i++;
        } else tirnakta = false;
      } else hucre += ch;
      continue;
    }

    if (ch === '"') tirnakta = true;
    else if (ch === ayirici) {
      satir.push(hucre);
      hucre = "";
    } else if (ch === "\n") {
      satir.push(hucre);
      satirlar.push(satir);
      satir = [];
      hucre = "";
    } else if (ch !== "\r") hucre += ch;
  }

  if (hucre || satir.length) {
    satir.push(hucre);
    satirlar.push(satir);
  }
  return satirlar;
}

/**
 * Excel "CSV UTF-8" değil de düz "CSV" olarak kaydedildiğinde Türkçe yerel
 * ayarda windows-1254 çıkıyor ve ç, ğ, ı, ş, ü bozuluyor. Önce UTF-8 katı
 * modda deneniyor; geçersiz bayt varsa 1254'e düşülüyor.
 */
function metneCevir(veri: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(veri).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1254").decode(veri);
  }
}

/* --------------------------------------------------------------- XLSX --- */

const OKU = (d: DataView, o: number, bayt: 2 | 4) =>
  bayt === 2 ? d.getUint16(o, true) : d.getUint32(o, true);

/** ZIP arşivinden tek bir dosyayı çıkarır. xlsx bir zip'ten ibaret. */
async function zipDosyaOku(veri: ArrayBuffer, secici: (ad: string) => boolean): Promise<string | null> {
  const d = new DataView(veri);

  // Merkezi dizin sonu kaydı sondan aranıyor; yorum alanı olabildiği için
  // sabit bir konumda değil.
  let eocd = -1;
  for (let i = veri.byteLength - 22; i >= 0 && i > veri.byteLength - 65558; i--) {
    if (OKU(d, i, 4) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const adet = OKU(d, eocd + 10, 2);
  let konum = OKU(d, eocd + 16, 4);

  for (let n = 0; n < adet; n++) {
    if (OKU(d, konum, 4) !== 0x02014b50) return null;

    const yontem = OKU(d, konum + 10, 2);
    const boyut = OKU(d, konum + 20, 4);
    const adUzunluk = OKU(d, konum + 28, 2);
    const ekUzunluk = OKU(d, konum + 30, 2);
    const yorumUzunluk = OKU(d, konum + 32, 2);
    const yerelKonum = OKU(d, konum + 42, 4);
    const ad = new TextDecoder().decode(new Uint8Array(veri, konum + 46, adUzunluk));

    if (secici(ad)) {
      // Yerel başlıktaki uzunluklar merkezi dizindekinden farklı olabiliyor.
      const yAd = OKU(d, yerelKonum + 26, 2);
      const yEk = OKU(d, yerelKonum + 28, 2);
      const basla = yerelKonum + 30 + yAd + yEk;
      const ham = new Uint8Array(veri, basla, boyut);

      if (yontem === 0) return new TextDecoder().decode(ham);

      const akis = new Blob([ham]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new TextDecoder().decode(await new Response(akis).arrayBuffer());
    }

    konum += 46 + adUzunluk + ekUzunluk + yorumUzunluk;
  }
  return null;
}

/** "BA12" → 52. Boş hücreler atlandığı için sütun harfinden konum çıkarılıyor. */
function sutunNo(referans: string): number {
  const harfler = /^[A-Z]+/.exec(referans)?.[0] ?? "A";
  let n = 0;
  for (const h of harfler) n = n * 26 + (h.charCodeAt(0) - 64);
  return n - 1;
}

function xmlCoz(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, k) => String.fromCharCode(Number(k)))
    .replace(/&amp;/g, "&");
}

/** Paylaşılan metin tablosu: xlsx metinleri hücrede değil burada tutuyor. */
function paylasilanMetinler(xml: string | null): string[] {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    // Bir hücre birden çok biçimlendirilmiş parçaya bölünmüş olabiliyor.
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => xmlCoz(t[1])).join(""),
  );
}

async function xlsxAyristir(veri: ArrayBuffer): Promise<string[][]> {
  const sayfa = await zipDosyaOku(veri, (ad) => /^xl\/worksheets\/sheet1\.xml$/.test(ad));
  if (!sayfa) throw new Error("Excel dosyasında sayfa bulunamadı.");

  const metinler = paylasilanMetinler(
    await zipDosyaOku(veri, (ad) => ad === "xl/sharedStrings.xml"),
  );

  const satirlar: string[][] = [];
  for (const r of sayfa.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const satir: string[] = [];
    for (const c of r[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const nitelik = c[1];
      const govde = c[2];
      const ref = /r="([A-Z]+\d+)"/.exec(nitelik)?.[1] ?? "";
      const tip = /t="([^"]+)"/.exec(nitelik)?.[1];

      let deger = "";
      if (tip === "inlineStr") {
        deger = [...govde.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => xmlCoz(t[1])).join("");
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(govde)?.[1] ?? "";
        deger = tip === "s" ? (metinler[Number(v)] ?? "") : xmlCoz(v);
      }

      const i = ref ? sutunNo(ref) : satir.length;
      while (satir.length < i) satir.push("");
      satir[i] = deger;
    }
    satirlar.push(satir);
  }
  return satirlar;
}

/* -------------------------------------------------------------- ortak --- */

export async function tabloOku(dosya: File): Promise<TabloSonuc> {
  const veri = await dosya.arrayBuffer();
  const xlsx = /\.xlsx$/i.test(dosya.name);

  // Eski .xls (BIFF) bambaşka bir ikili biçim; okumaya çalışmak yerine
  // net bir mesaj vermek daha faydalı.
  if (/\.xls$/i.test(dosya.name)) {
    throw new Error("Eski .xls biçimi desteklenmiyor. Excel'de .xlsx ya da CSV olarak kaydet.");
  }

  const hamSatirlar = xlsx ? await xlsxAyristir(veri) : csvAyristir(metneCevir(veri));
  const dolu = hamSatirlar.filter((s) => s.some((h) => h.trim() !== ""));
  if (dolu.length === 0) return { basliklar: [], satirlar: [] };

  const basliklar = dolu[0].map((b, i) => b.trim() || `Sütun ${i + 1}`);
  const satirlar = dolu.slice(1).map((s) => {
    const kayit: TabloSatiri = {};
    basliklar.forEach((b, i) => {
      kayit[b] = (s[i] ?? "").trim();
    });
    return kayit;
  });

  return { basliklar, satirlar };
}
