import type { Element, ElementContent, Properties, Root, RootContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import type { BaglantiCozucu } from "@/lib/blog-baglanti";

/**
 * Blog gövdesi HTML temizleyicisi — sayfaya basmadan önce.
 *
 * Gövde `dangerouslySetInnerHTML` ile basılıyor. Bugüne kadar "yazan yönetici,
 * kaynak güvenilir" denip temizlenmiyordu. Bu iki sebeple artık yetmiyor:
 *
 *   1. İçerik yalnızca editörden gelmiyor: WordPress'ten taşınan HTML, elle
 *      yapıştırılan HTML ve ileride yapay zekâyla hazırlanan taslaklar da var.
 *      Birindeki tek bir `<script>` ya da `onerror` her ziyaretçide çalışır.
 *   2. Yönetici oturumu çalınırsa bu alan siteye kalıcı kod gömmenin en kısa
 *      yolu olur.
 *
 * Yaklaşım İZİN LİSTESİ: tanınmayan etiket ve öznitelik geçmiyor. Yasak
 * listesi (yalnızca script'i at) yeni bir HTML özelliğinde sessizce delik
 * bırakır. Liste editörün ürettiği işaretlemeden (tiptap/, lib/blog-bloklar)
 * ve WordPress'ten gelen içerikten çıkarıldı; canlıdaki 22 yazının gövdesi
 * bu temizlikten değişmeden geçiyor (yalnızca gövdedeki H1 → H2).
 *
 * Kaynak: ahmetekinci.com.tr blog sistemi (apps/site/src/lib/blogContent.ts),
 * aynı kurallarla; oradaki yasak listesi burada izin listesine çevrildi.
 */

type Parent = Root | Element;

/** Hiç geçmeyen, içiyle birlikte atılan etiketler. */
const ATILAN = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "textarea",
  "select",
  "option",
  "meta",
  "link",
  "base",
  "svg",
  "math",
  "frame",
  "frameset",
  "head",
  "title",
]);

/**
 * İzinli etiketler ve her birinde geçen öznitelikler (hast özellik adlarıyla:
 * className, dataBlok…). Burada olmayan etiket SÖKÜLÜYOR ama içi kalıyor
 * (ör. WordPress'in <font>'u metnini kaybetmesin).
 */
const ORTAK = ["className", "id", "title", "dir", "lang", "ariaHidden", "ariaLabel"];
const IZINLI: Record<string, string[]> = {
  // Buton bloğu: <p data-blok="buton"><a data-buton>…</a></p> (tiptap/SssButonTablo).
  p: ["dataBlok"],
  br: [],
  hr: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  del: [],
  ins: [],
  mark: [],
  small: [],
  sub: [],
  sup: [],
  code: [],
  kbd: [],
  pre: [],
  span: [],
  // SSS bloğu: madde ve cevap kapları (tiptap/SssButonTablo).
  div: ["dataSssMadde", "dataSssCevap"],
  section: ["dataBlok"],
  blockquote: ["cite"],
  q: ["cite"],
  h2: [],
  h3: ["dataSssSoru"],
  h4: [],
  ul: [],
  ol: ["start", "reversed", "type"],
  li: ["value"],
  a: ["href", "target", "rel", "dataCtaId", "dataPlacement", "dataCtaLabel", "dataButon"],
  img: ["src", "alt", "width", "height", "loading", "decoding", "dataLightbox"],
  figure: ["dataGorsel", "dataDecorative"],
  figcaption: [],
  picture: [],
  source: ["srcSet", "type", "media", "sizes"],
  aside: ["dataBlok", "dataAd", "dataUrl", "dataNot", "dataBos"],
  // Prompt bloğunun "Kopyala" düğmesi (tiptap/BlogBloklari → PromptBlock).
  // Form yok, type=button zorunlu: tıklanınca hiçbir yere bir şey göndermiyor.
  button: ["type", "dataKopyala"],
  table: [],
  caption: [],
  thead: [],
  tbody: [],
  tfoot: [],
  tr: [],
  th: ["colSpan", "rowSpan", "scope"],
  td: ["colSpan", "rowSpan"],
  details: ["open"],
  summary: [],
  iframe: ["src", "width", "height", "allow", "allowFullScreen", "title"],
};

/** Yalnız bu sitelerden video gömülebilir. */
const GOMME_SITELERI = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
]);

/** Dış bağlantıda korunan rel işaretleri (sponsorlu/ücretli içerik beyanı). */
const KORUNAN_REL = new Set(["nofollow", "sponsored", "ugc"]);

const elementMi = (n: RootContent | ElementContent | Root): n is Element => n.type === "element";

/**
 * Adres güvenli mi? Görünmez karakterler atılarak bakılıyor: "java\tscript:"
 * tarayıcıda javascript: olarak çalışıyor.
 */
export function guvenliAdres(deger: string, tur: "href" | "src"): boolean {
  const sade = Array.from(deger.trim())
    .filter((c) => {
      const kod = c.charCodeAt(0);
      return kod > 31 && kod !== 127 && !/\s/.test(c);
    })
    .join("");
  if (!sade) return false;
  if (/^(#|\/(?!\/)|\.\/|\.\.\/)/.test(sade)) return true;
  if (tur === "href" && /^(mailto|tel):/i.test(sade)) return true;
  // "//alan.com" (protokolsüz) yalnız https olarak kabul edilir.
  if (/^\/\//.test(sade)) return true;
  return /^https?:/i.test(sade);
}

function relListesi(deger: unknown): string[] {
  if (Array.isArray(deger)) return deger.map(String);
  if (typeof deger === "string") return deger.split(/\s+/).filter(Boolean);
  return [];
}

/** Kendi alan adlarımız: mutlak yazılmış olsa da iç bağlantı sayılıyor. */
const KENDI_ALANLAR = new Set(["ahmetekinciakademi.com", "www.ahmetekinciakademi.com", "panel.ahmetekinciakademi.com"]);

function disBaglantiMi(href: string): boolean {
  if (!/^(https?:)?\/\//i.test(href.trim())) return false;
  try {
    return !KENDI_ALANLAR.has(new URL(href.trim(), "https://ahmetekinciakademi.com").hostname.toLowerCase());
  } catch {
    return true;
  }
}

function oznitelikleriTemizle(dugum: Element): void {
  const izinli = new Set([...ORTAK, ...(IZINLI[dugum.tagName] ?? [])]);
  const yeni: Properties = {};
  for (const [ad, deger] of Object.entries(dugum.properties)) {
    if (!izinli.has(ad)) continue;
    if (ad === "href" || ad === "src") {
      if (typeof deger !== "string" || !guvenliAdres(deger, ad)) continue;
    }
    yeni[ad] = deger;
  }
  dugum.properties = yeni;
}

function baglantiHazirla(dugum: Element): void {
  const href = typeof dugum.properties.href === "string" ? dugum.properties.href : "";
  const yeniSekme = dugum.properties.target === "_blank";
  if (dugum.properties.target !== undefined && !yeniSekme) delete dugum.properties.target;

  // Reklam/ücretli içerik beyanı (sponsored, nofollow, ugc) korunuyor,
  // yenisi eklenmiyor: hangi bağlantının ücretli olduğunu yazar biliyor.
  const korunan = relListesi(dugum.properties.rel).filter((r) => KORUNAN_REL.has(r.toLowerCase()));
  const rel = [...korunan];
  // Yeni sekmede açılan sayfa window.opener ile bu sayfayı yönetemesin;
  // dışarıya giderken adresimiz de taşınmasın.
  if (yeniSekme) rel.unshift(...(href && disBaglantiMi(href) ? ["noopener", "noreferrer"] : ["noopener"]));

  if (rel.length) dugum.properties.rel = rel;
  else delete dugum.properties.rel;
}

/** Gömülü video: izinli siteden değilse tamamen atılıyor. */
function iframeGecerli(dugum: Element): boolean {
  const src = typeof dugum.properties.src === "string" ? dugum.properties.src : "";
  try {
    const adres = new URL(src, "https://ahmetekinciakademi.com");
    if (adres.protocol !== "https:" || !GOMME_SITELERI.has(adres.hostname)) return false;
  } catch {
    return false;
  }
  dugum.properties.loading = "lazy";
  dugum.properties.referrerPolicy = "strict-origin-when-cross-origin";
  return true;
}

function dolas(ebeveyn: Parent, baglanti?: BaglantiCozucu): void {
  const sonraki: (RootContent | ElementContent)[] = [];
  for (const cocuk of ebeveyn.children) {
    if (cocuk.type === "comment" || cocuk.type === "doctype") continue;
    if (!elementMi(cocuk)) {
      sonraki.push(cocuk);
      continue;
    }

    const etiket = cocuk.tagName;
    if (ATILAN.has(etiket)) continue;

    // Gövdede H1 olmamalı: sayfanın tek H1'i yazı başlığı. WordPress'ten
    // gelen içerikte bir tane var ve arama motoru iki ana başlık görüyordu.
    if (etiket === "h1") cocuk.tagName = "h2";
    // H5/H6 editörde yok; içerik yapısında H4'ün altı kalmıyor.
    if (etiket === "h5" || etiket === "h6") cocuk.tagName = "h4";

    if (!(cocuk.tagName in IZINLI)) {
      // Tanınmayan etiket: kendisi gidiyor, içi kalıyor.
      dolas(cocuk, baglanti);
      sonraki.push(...(cocuk.children as ElementContent[]));
      continue;
    }

    oznitelikleriTemizle(cocuk);
    // Öznitelik temizliğinden SONRA: iframeGecerli kendi eklediği
    // loading/referrerpolicy'yi yazıyor, önce çalışsa temizlik onları silerdi.
    if (cocuk.tagName === "iframe" && !iframeGecerli(cocuk)) continue;
    if (cocuk.tagName === "button") cocuk.properties.type = "button";
    if (cocuk.tagName === "a" && baglanti && typeof cocuk.properties.href === "string") {
      // İç bağlantı son adresine (lib/blog-baglanti). Hedef kaldırılmışsa
      // bağlantı kalkıyor, metni kalıyor.
      const son = baglanti(cocuk.properties.href);
      if (son === null) {
        dolas(cocuk, baglanti);
        sonraki.push(...(cocuk.children as ElementContent[]));
        continue;
      }
      cocuk.properties.href = son;
    }
    if (cocuk.tagName === "a") baglantiHazirla(cocuk);
    if (cocuk.tagName === "img" && !cocuk.properties.src) continue;

    dolas(cocuk, baglanti);
    // Bağlantısı ya da metni kalmamış buton (hedefi kaldırılmış, boş düğme)
    // yazıda boş bir kutu olarak durmasın.
    if (cocuk.tagName === "p" && cocuk.properties.dataBlok === "buton" && !butonGecerli(cocuk)) continue;
    if (cocuk.tagName === "table") {
      sonraki.push(tabloHazirla(cocuk));
      continue;
    }
    sonraki.push(cocuk);
  }
  ebeveyn.children = sonraki as typeof ebeveyn.children;
}

function metniVar(d: Element): boolean {
  return d.children.some((c) => (c.type === "text" ? c.value.trim() !== "" : c.type === "element" && metniVar(c)));
}

function butonGecerli(p: Element): boolean {
  return p.children.some((c) => elementMi(c) && c.tagName === "a" && Boolean(c.properties.href) && metniVar(c));
}

/**
 * Tablo: editör başlık satırını <tbody>'nin ilk satırı olarak yazıyor
 * (ProseMirror <thead> üretemiyor); tümü <th> olan ilk satır <thead>'e
 * taşınıyor. Tablo yatay kaydırılabilir bir kutuya sarılıyor: geniş tablo dar
 * ekranda sayfayı yana kaydırmasın, kendi içinde kaysın. Kutu klavyeyle
 * odaklanabiliyor (kaydırılabilir bölge erişilebilir olsun).
 */
function tabloHazirla(tablo: Element): Element {
  const govde = tablo.children.find((c): c is Element => elementMi(c) && c.tagName === "tbody");
  const basVar = tablo.children.some((c) => elementMi(c) && c.tagName === "thead");
  if (govde && !basVar) {
    const ilkIndis = govde.children.findIndex((c) => elementMi(c) && c.tagName === "tr");
    const ilk = ilkIndis >= 0 ? (govde.children[ilkIndis] as Element) : null;
    const hucreler = ilk ? ilk.children.filter(elementMi) : [];
    if (ilk && hucreler.length && hucreler.every((h) => h.tagName === "th")) {
      govde.children.splice(ilkIndis, 1);
      const bas: Element = { type: "element", tagName: "thead", properties: {}, children: [ilk] };
      tablo.children.splice(tablo.children.indexOf(govde), 0, bas);
      if (!govde.children.some(elementMi)) tablo.children.splice(tablo.children.indexOf(govde), 1);
    }
  }
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["aea-tablo"], role: "region", tabIndex: 0, ariaLabel: "Tablo" },
    children: [tablo],
  };
}

/** Blog gövdesini güvenli HTML'e çevirir. Boş girdi boş döner. */
export function blogHtmlTemizle(html: string, secenek?: { baglanti?: BaglantiCozucu }): string {
  if (!html || !html.trim()) return "";
  const agac = fromHtml(html, { fragment: true });
  dolas(agac, secenek?.baglanti);
  return toHtml(agac);
}
