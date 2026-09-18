import { Node, mergeAttributes, InputRule, type Editor } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import { TextSelection } from "@tiptap/pm/state";
import { BLOKLAR, type BlokTipi } from "@/lib/blog-bloklar";

/**
 * Blog için özel Tiptap blokları: Bilgi, Uyarı (Dikkat), İpucu (Ahmet'in Notu)
 * ve Prompt.
 *
 * Neden gerçek node/extension, HTML'e sınıf basmak değil? İçerik hem JSON hem
 * HTML olarak saklanıyor; node olunca JSON'da semantik olarak ayrılabiliyor
 * (infoBlock / warningBlock / tipBlock / promptBlock) ve tasarım ileride
 * değişse bile içerik yapısı korunuyor.
 *
 * Tek kaynak ilkesi: `renderHTML` çıktısı hem editörde (ProseMirror toDOM ile
 * doğrudan) hem de public blog sayfasında (dangerouslySetInnerHTML) kullanılan
 * HTML. Böylece yazarken görünen ile yayındaki bire bir aynı. İkonlar CSS
 * mask ile geliyor (globals.css) — SVG'yi ProseMirror serileştirmesine sokup
 * namespace derdine girmemek için. Etiketler <span>, gerçek <h2>/<h3> değil;
 * bu yüzden İçindekiler (TOC) bu başlıkları toplamıyor.
 */

const dataOf: Record<BlokTipi, string> = Object.fromEntries(
  BLOKLAR.map((b) => [b.tip, b.data]),
) as Record<BlokTipi, string>;

const etiketOf: Record<BlokTipi, string> = Object.fromEntries(
  BLOKLAR.map((b) => [b.tip, b.etiket]),
) as Record<BlokTipi, string>;

const komutOf: Record<BlokTipi, string> = Object.fromEntries(
  BLOKLAR.map((b) => [b.tip, b.komut]),
) as Record<BlokTipi, string>;

/** Slash tetikleyici deseni: satır başında `/bilgi ` yazıldığında. */
function slashDeseni(komut: string): RegExp {
  return new RegExp(`^/${komut}\\s$`);
}

/* ----------------------------------------------- Bilgi / Uyarı / İpucu --- */
/*
  Üçü de aynı iskelet: <aside> içinde sabit başlık (ikon + etiket) ve zengin
  metin gövdesi. İçerik `paragraph+` — paragraf, kalın, italik, satır içi link
  ve satır içi kod destekleniyor; başlık (heading) bilinçli olarak yok, hem
  editoryal sadelik için hem de TOC'a sızmasın diye.
*/
function kutuBlok(tip: Exclude<BlokTipi, "promptBlock">) {
  const data = dataOf[tip];
  const varsayilanEtiket = etiketOf[tip];
  const komut = komutOf[tip];

  return Node.create({
    name: tip,
    group: "block",
    content: "paragraph+",
    defining: true,

    addAttributes() {
      return {
        // İpucu bloğunda etiket editörde değiştirilebiliyor (varsayılan
        // "Ahmet'in Notu"). Diğerlerinde sabit ama round-trip için yine
        // attribute olarak tutuluyor. DOM'a ayrı bir attribute yazılmıyor;
        // etiket metni renderHTML içinde <span> olarak basılıyor.
        etiket: {
          default: varsayilanEtiket,
          parseHTML: (el) =>
            (el.querySelector(".aea-blok__etiket")?.textContent ?? "").trim() || varsayilanEtiket,
          renderHTML: () => ({}),
        },
      };
    },

    parseHTML() {
      // Yalnızca gövde parse ediliyor: başlıktaki etiket metni içeriğe
      // karışmasın diye contentElement gövdeyi işaret ediyor.
      return [{ tag: `aside[data-blok="${data}"]`, contentElement: ".aea-blok__govde" }];
    },

    renderHTML({ node, HTMLAttributes }) {
      const etiket = (node.attrs.etiket as string) || varsayilanEtiket;
      return [
        "aside",
        mergeAttributes(HTMLAttributes, { class: `aea-blok aea-blok--${data}`, "data-blok": data }),
        [
          "div",
          { class: "aea-blok__ust", contenteditable: "false" },
          ["span", { class: "aea-blok__ikon", "aria-hidden": "true" }],
          ["span", { class: "aea-blok__etiket" }, etiket],
        ],
        ["div", { class: "aea-blok__govde" }, 0],
      ];
    },

    addInputRules() {
      // `/bilgi ` → paragrafı bu bloğa sar (metin silinip sarılıyor).
      return [
        new InputRule({
          find: slashDeseni(komut),
          handler: ({ range, chain }) => {
            chain().deleteRange(range).wrapIn(tip).run();
          },
        }),
      ];
    },
  });
}

export const InfoBlock = kutuBlok("infoBlock");
export const WarningBlock = kutuBlok("warningBlock");
export const TipBlock = kutuBlok("tipBlock");

/* ------------------------------------------------------------- Prompt --- */
/*
  Prompt kod bloğu değil ama davranışları (Enter → yeni satır, boşlukları
  koru, çok satır) kod bloğuyla aynı; bu yüzden CodeBlock'tan türetiliyor —
  klavye kısayolları (üç Enter / aşağı ok ile çık, başta Backspace ile lift)
  hazır geliyor. Görünüm editoryal bir prompt kartı: başlık, "Kopyala" düğmesi
  ve okunaklı (monospace zorunlu değil) prompt metni.

  "Kopyala" düğmesi renderHTML'de gerçek bir <button> olarak basılıyor;
  editörde atıl (chrome), public tarafta küçük bir client bileşeni bağlıyor.
*/
export const PromptBlock = CodeBlock.extend({
  name: "promptBlock",

  addAttributes() {
    return {};
  },

  parseHTML() {
    // Metin yalnızca <pre>'den okunuyor; başlık ve "Kopyala" içeriğe girmiyor.
    return [{ tag: 'aside[data-blok="prompt"]', preserveWhitespace: "full", contentElement: "pre" }];
  },

  renderHTML() {
    return [
      "aside",
      { class: "aea-blok aea-blok--prompt", "data-blok": "prompt" },
      [
        "div",
        { class: "aea-blok__ust", contenteditable: "false" },
        ["span", { class: "aea-blok__ikon", "aria-hidden": "true" }],
        ["span", { class: "aea-blok__etiket" }, "Örnek Prompt"],
        [
          "button",
          {
            class: "aea-prompt__kopyala",
            type: "button",
            "aria-label": "Prompt metnini kopyala",
            "data-kopyala": "",
          },
          "Kopyala",
        ],
      ],
      ["pre", { class: "aea-prompt__metin" }, 0],
    ];
  },

  addInputRules() {
    // `/prompt ` → mevcut paragrafı prompt bloğuna çevir.
    return [
      new InputRule({
        find: slashDeseni("prompt"),
        handler: ({ range, chain }) => {
          chain().deleteRange(range).setNode("promptBlock").run();
        },
      }),
    ];
  },
});

export const BlogBloklari = [InfoBlock, WarningBlock, TipBlock, PromptBlock];

/* --------------------------------------------------------- yardımcılar --- */

/**
 * Menüden yeni (boş) blok ekler ve imleci içine koyar.
 *
 * insertContent imleci eklenen bloğun ardına bırakıyor; "içine hemen
 * yazılabilsin" gereği için düğümü oluşturup imleci ilk içerik konumuna
 * taşıyoruz.
 */
export function blokEkle(editor: Editor, tip: BlokTipi): void {
  editor
    .chain()
    .focus()
    .command(({ tr, state, dispatch }) => {
      const type = state.schema.nodes[tip];
      if (!type) return false;
      const node = type.createAndFill();
      if (!node) return false;
      if (dispatch) {
        const pos = tr.selection.from;
        tr.replaceSelectionWith(node, false);
        // Yeni bloğun ilk içerik konumuna (pos + 1) en yakın metin seçimi.
        const sel = TextSelection.near(tr.doc.resolve(Math.min(pos + 1, tr.doc.content.size)));
        tr.setSelection(sel).scrollIntoView();
      }
      return true;
    })
    .run();
}

/**
 * İpucu (Ahmet'in Notu) bloğunun etiketini günceller. İmleç bir tipBlock
 * içindeyse çalışır; boş bırakılırsa varsayılana döner.
 */
export function notEtiketiniGuncelle(editor: Editor, yeni: string): void {
  const temiz = yeni.trim() || "Ahmet'in Notu";
  editor.chain().focus().updateAttributes("tipBlock", { etiket: temiz }).run();
}
