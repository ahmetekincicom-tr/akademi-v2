import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

/**
 * Blog içerik görseli — metadata'lı figure node'u.
 *
 * Neden ayrı bir node (base Image'a ek)? Taşınan WordPress yazılarındaki düz
 * `<img>` etiketleri base `Image` node'uyla parse edilip düz `<img>` olarak
 * round-trip ediyor; yeni yüklemeler ise bu `blogGorsel` node'uyla `<figure>`
 * olarak saklanıyor. Böylece eski bir yazı editörde açılıp kaydedilse bile
 * taşınmış görseller yeniden yazılmıyor (spec #17).
 *
 * Serileştirme tek kaynak: renderHTML çıktısı hem editörde (ProseMirror toDOM)
 * hem public sayfada (dangerouslySetInnerHTML) kullanılan HTML. SEO açısından
 * kritik alanlar (src, alt, width, height) her zaman HTML'e geçiyor; caption
 * varsa `<figcaption>` olarak, dekoratif görselde `alt=""`.
 */

const sayi = (v: string | null): number | null => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : null;
};

export const BlogGorsel = Image.extend({
  name: "blogGorsel",
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => el.querySelector("img")?.getAttribute("src") ?? null,
        renderHTML: () => ({}),
      },
      alt: {
        default: "",
        parseHTML: (el) => el.querySelector("img")?.getAttribute("alt") ?? "",
        renderHTML: () => ({}),
      },
      caption: {
        default: "",
        parseHTML: (el) => el.querySelector("figcaption")?.textContent?.trim() ?? "",
        renderHTML: () => ({}),
      },
      title: {
        default: null,
        parseHTML: (el) => el.querySelector("img")?.getAttribute("title") || null,
        renderHTML: () => ({}),
      },
      width: {
        default: null,
        parseHTML: (el) => sayi(el.querySelector("img")?.getAttribute("width") ?? null),
        renderHTML: () => ({}),
      },
      height: {
        default: null,
        parseHTML: (el) => sayi(el.querySelector("img")?.getAttribute("height") ?? null),
        renderHTML: () => ({}),
      },
      lightboxEnabled: {
        default: true,
        parseHTML: (el) => el.querySelector("img")?.getAttribute("data-lightbox") === "1",
        renderHTML: () => ({}),
      },
      decorative: {
        default: false,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-decorative") === "1",
        renderHTML: () => ({}),
      },
      // Bilgi amaçlı (SEO paneli / hata ayıklama); public HTML'i etkilemiyor.
      originalFilename: { default: null, rendered: false },
      mimeType: { default: null, rendered: false },
      fileSize: { default: null, rendered: false },
    };
  },

  parseHTML() {
    return [{ tag: "figure[data-gorsel]" }];
  },

  renderHTML({ node }) {
    const a = node.attrs as {
      src: string;
      alt: string;
      caption: string;
      title: string | null;
      width: number | null;
      height: number | null;
      lightboxEnabled: boolean;
      decorative: boolean;
    };

    const imgOz: Record<string, string | number> = {
      src: a.src,
      // Dekoratif görselde alt="" (bilinçli boş); aksi halde alt metni.
      alt: a.decorative ? "" : a.alt || "",
      class: "blog-gorsel",
      loading: "lazy",
      decoding: "async",
    };
    if (a.width) imgOz.width = a.width;
    if (a.height) imgOz.height = a.height;
    if (a.title) imgOz.title = a.title;
    if (a.lightboxEnabled) imgOz["data-lightbox"] = "1";

    const figOz: Record<string, string> = { class: "blog-figur", "data-gorsel": "" };
    if (a.decorative) figOz["data-decorative"] = "1";

    const cocuklar: DOMOutputSpec[] = [["img", mergeAttributes(imgOz)]];
    if (!a.decorative && a.caption) {
      cocuklar.push(["figcaption", { class: "blog-figcaption" }, a.caption]);
    }

    return ["figure", mergeAttributes(figOz), ...cocuklar] as unknown as DOMOutputSpec;
  },
});
