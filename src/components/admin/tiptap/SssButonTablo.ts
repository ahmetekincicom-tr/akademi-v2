import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { SSS_VARSAYILAN_BASLIK, BUTON_VARSAYILAN_HREF } from "@/lib/blog-sss";

/**
 * Blog editörünün SSS, Buton ve Tablo blokları.
 *
 * Kaynak: ahmetekinci.com.tr paneli (apps/panel/src/screens/blog/editor/
 * blocks.ts); işaretleme akademinin blok düzenine (data-blok + aea-* sınıfı)
 * uyarlandı. HTML sözleşmesi sabit: site temizleyicisi (lib/blog-temizle),
 * FAQPage JSON-LD'si (lib/blog-sss) ve stiller (globals.css) buna dayanıyor.
 *
 *   SSS    <section class="aea-sss" data-blok="sss"><h2>Sıkça Sorulan Sorular</h2>
 *            <div class="aea-sss__madde" data-sss-madde>
 *              <h3 class="aea-sss__soru" data-sss-soru>Soru</h3>
 *              <div class="aea-sss__cevap" data-sss-cevap><p>Cevap</p></div>
 *            </div>…
 *          </section>
 *   Buton  <p class="aea-buton" data-blok="buton"><a href="/egitimler/" data-buton>Metin</a></p>
 *   Tablo  <table><tbody><tr><th>…</th></tr>…</tbody></table>
 *          (başlık satırı sitede <thead>'e taşınıyor, tablo kaydırma kutusuna
 *          sarılıyor: lib/blog-temizle)
 *
 * Sorular H3 ama İçindekiler'e girmiyor (lib/blog-icerik data-sss-soru'yu
 * atlıyor); bölüm başlığı (H2) giriyor.
 */

// Kutuların içinde yalnız metin blokları: başlık, görsel, tablo iç içe girmez.
const METIN_BLOKLARI = "(paragraph | bulletList | orderedList)+";

export const SssBlok = Node.create({
  name: "sssBlock",
  group: "block",
  // Bölüm başlığı (düzenlenebilir H2/H3) ve en az bir soru-cevap.
  content: "heading sssMadde+",
  defining: true,
  isolating: true,
  parseHTML() {
    return [{ tag: 'section[data-blok="sss"]' }];
  },
  renderHTML() {
    return ["section", { class: "aea-sss", "data-blok": "sss" }, 0];
  },
});

export const SssMadde = Node.create({
  name: "sssMadde",
  content: "sssSoru sssCevap",
  defining: true,
  isolating: true,
  parseHTML() {
    return [{ tag: "div[data-sss-madde]", priority: 100 }];
  },
  renderHTML() {
    return ["div", { class: "aea-sss__madde", "data-sss-madde": "" }, 0];
  },
});

export const SssSoru = Node.create({
  name: "sssSoru",
  content: "inline*",
  marks: "",
  defining: true,
  parseHTML() {
    // Normal başlık kuralından önce eşleşsin.
    return [{ tag: "h3[data-sss-soru]", priority: 100 }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["h3", mergeAttributes(HTMLAttributes, { class: "aea-sss__soru", "data-sss-soru": "" }), 0];
  },
  addKeyboardShortcuts() {
    return {
      // Soruda Enter cevaba geçer (soru bölünmez).
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.parent.type.name !== this.name) return false;
        const cevapBasi = $from.after() + 2; // cevap düğümüne ve ilk bloğuna gir
        const tr = editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(cevapBasi)));
        editor.view.dispatch(tr.scrollIntoView());
        return true;
      },
    };
  },
});

export const SssCevap = Node.create({
  name: "sssCevap",
  content: METIN_BLOKLARI,
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-sss-cevap]", priority: 100 }];
  },
  renderHTML() {
    return ["div", { class: "aea-sss__cevap", "data-sss-cevap": "" }, 0];
  },
});

export const ButonBlok = Node.create({
  name: "butonBlock",
  group: "block",
  content: "text*",
  marks: "",
  defining: true,
  addAttributes() {
    return {
      href: {
        default: BUTON_VARSAYILAN_HREF,
        parseHTML: (el: HTMLElement) => el.querySelector("a[data-buton]")?.getAttribute("href") ?? BUTON_VARSAYILAN_HREF,
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'p[data-blok="buton"]',
        priority: 100,
        getAttrs: (el) => ((el as HTMLElement).querySelector("a[data-buton]") ? null : false),
        contentElement: (el) => (el as HTMLElement).querySelector<HTMLElement>("a[data-buton]") ?? (el as HTMLElement),
      },
    ];
  },
  renderHTML({ node }) {
    const href = String(node.attrs.href || BUTON_VARSAYILAN_HREF);
    return ["p", { class: "aea-buton", "data-blok": "buton" }, ["a", { href, "data-buton": "" }, 0]];
  },
});

// Tablo: sade çıktı. Sütun genişliği ve hizalama yazılmıyor (sitenin CSS'i
// belirliyor); hücrelerde yalnız metin blokları.
const BlogTablo = Table.configure({ resizable: false, allowTableNodeSelection: true });
const sadeHucre = <T extends typeof TableCell | typeof TableHeader>(eklenti: T) =>
  eklenti.extend({
    content: METIN_BLOKLARI,
    addAttributes() {
      return {
        colspan: { default: 1 },
        rowspan: { default: 1 },
        colwidth: { default: null, rendered: false },
      };
    },
  });

export const SssButonTablo = [
  SssBlok,
  SssMadde,
  SssSoru,
  SssCevap,
  ButonBlok,
  BlogTablo,
  TableRow,
  sadeHucre(TableHeader),
  sadeHucre(TableCell),
];

/* --------------------------------------------------------- komutlar --- */

function sssMaddeIcerik() {
  return { type: "sssMadde", content: [{ type: "sssSoru" }, { type: "sssCevap", content: [{ type: "paragraph" }] }] };
}

/** Yeni SSS bölümü (başlık + boş bir soru); imleç ilk soruya. */
export function sssEkle(editor: Editor): void {
  const { from } = editor.state.selection;
  editor
    .chain()
    .focus()
    .insertContent({
      type: "sssBlock",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: SSS_VARSAYILAN_BASLIK }] },
        sssMaddeIcerik(),
      ],
    })
    .run();
  // Başlığın ardındaki ilk soru: bölümün başından ileri doğru ilk sssSoru.
  let hedef = -1;
  editor.state.doc.nodesBetween(from, editor.state.doc.content.size, (n, p) => {
    if (hedef === -1 && n.type.name === "sssSoru") hedef = p + 1;
    return hedef === -1;
  });
  if (hedef > 0) editor.chain().focus().setTextSelection(hedef).run();
}

/** İmlecin bulunduğu sorunun ardına yeni soru-cevap ekler. */
export function sssMaddeEkle(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name !== "sssMadde") continue;
    const sonra = $from.after(d);
    editor.chain().insertContentAt(sonra, sssMaddeIcerik()).setTextSelection(sonra + 2).focus().run();
    return true;
  }
  return false;
}

/** İmlecin bulunduğu soru-cevabı siler (bölümde tek soru kaldıysa bölümü). */
export function sssMaddeSil(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name !== "sssMadde") continue;
    const bolum = $from.node(d - 1);
    if (bolum.childCount <= 2) {
      // Başlık + tek soru: bölümün kendisi gidiyor (boş SSS kalmasın).
      editor.chain().focus().deleteRange({ from: $from.before(d - 1), to: $from.after(d - 1) }).run();
    } else {
      editor.chain().focus().deleteRange({ from: $from.before(d), to: $from.after(d) }).run();
    }
    return true;
  }
  return false;
}

/** Buton ekler; imleç düğme metnine. */
export function butonEkle(editor: Editor, href: string, metin: string): void {
  editor
    .chain()
    .focus()
    .insertContent({ type: "butonBlock", attrs: { href }, content: metin ? [{ type: "text", text: metin }] : [] })
    .run();
}

/** 3×3, başlık satırlı tablo. */
export function tabloEkle(editor: Editor): void {
  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}
