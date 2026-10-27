import type { Element, ElementContent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";

/**
 * Blog SSS bloğu ve buton bloğu: ortak sabitler ve FAQPage verisi.
 *
 * Editör işaretlemesi (components/admin/tiptap/SssButonTablo):
 *   <section data-blok="sss"><h2>Başlık</h2>
 *     <div data-sss-madde><h3 data-sss-soru>Soru</h3><div data-sss-cevap>…</div></div>…
 *   </section>
 *
 * Kaynak: ahmetekinci.com.tr (apps/site/src/lib/blogSeo.ts → extractFaq).
 */

export const SSS_VARSAYILAN_BASLIK = "Sıkça Sorulan Sorular";
export const BUTON_VARSAYILAN_HREF = "/egitimler/";

/** FAQPage için en az bu kadar soru-cevap: tek soruluk blok SSS sayfası değil. */
export const SSS_EN_AZ = 2;

export type SssMaddesi = { soru: string; cevap: string };

function* ogeler(dugum: Root | Element): Generator<Element> {
  for (const c of dugum.children) {
    if (c.type !== "element") continue;
    yield c;
    yield* ogeler(c);
  }
}

const isaretli = (d: Element, ad: string) => d.properties[ad] !== undefined && d.properties[ad] !== null && d.properties[ad] !== false;

function ilk(d: Element, ad: string): Element | undefined {
  for (const o of ogeler(d)) if (isaretli(o, ad)) return o;
  return undefined;
}

/** Düz metin: bloklar arası boşluk, fazla boşluk tek. */
function duz(d: Element): string {
  const parcalar: string[] = [];
  const topla = (n: ElementContent) => {
    if (n.type === "text") parcalar.push(n.value);
    else if (n.type === "element") {
      if (n.tagName === "br") parcalar.push(" ");
      n.children.forEach(topla);
      if (/^(p|li|div|h[2-4]|ul|ol)$/.test(n.tagName)) parcalar.push(" ");
    }
  };
  d.children.forEach(topla);
  return parcalar.join("").replace(/\s+/g, " ").trim();
}

/** Gövdedeki SSS bloklarının soru-cevapları (cevap düz metin). */
export function sssCikar(html: string): SssMaddesi[] {
  if (!html.includes("data-blok")) return [];
  const agac = fromHtml(html, { fragment: true });
  const sonuc: SssMaddesi[] = [];
  for (const bolum of ogeler(agac)) {
    if (bolum.properties.dataBlok !== "sss") continue;
    for (const madde of ogeler(bolum)) {
      if (!isaretli(madde, "dataSssMadde")) continue;
      const s = ilk(madde, "dataSssSoru");
      const c = ilk(madde, "dataSssCevap");
      const soru = s ? duz(s) : "";
      const cevap = c ? duz(c) : "";
      if (soru && cevap) sonuc.push({ soru, cevap });
    }
  }
  return sonuc;
}

/** FAQPage'e girecek soru-cevaplar; SSS_EN_AZ'dan azsa boş. */
export function yaziSss(html: string): SssMaddesi[] {
  const m = sssCikar(html);
  return m.length >= SSS_EN_AZ ? m : [];
}
