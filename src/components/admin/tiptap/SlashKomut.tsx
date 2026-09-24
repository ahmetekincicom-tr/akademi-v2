"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionOptions, type SuggestionProps, type SuggestionKeyDownProps } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { PluginKey } from "@tiptap/pm/state";
import tippy, { type Instance as TippyInstance, type GetReferenceClientRect } from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { blokEkle } from "@/components/admin/tiptap/BlogBloklari";

/**
 * "/" slash komut menüsü.
 *
 * Metin akışını bölmeden hızlı blok ekleme: boş bir paragrafta `/` yazınca
 * filtrelenebilir bir menü açılır (H2, H3, Görsel, Bilgi, Uyarı, Ahmet'in Notu, Kaynak,
 * Prompt). Her madde MEVCUT editör komutlarına/`blokEkle` yardımcısına bağlı;
 * yeni veri yapısı ya da yeni node tanımı YOK. Görsel yükleme akışı editörde
 * zaten var olan dosya seçiciyi tetikliyor (onGorsel).
 *
 * @tiptap/suggestion altyapısı üzerine kurulu; tetik yalnızca paragraf içinde
 * çalışır (prompt/kod/kutu başlıkları etkilenmez).
 */

export type SlashItem = {
  baslik: string;
  aciklama: string;
  /** Menüde solda görünen kısa rozet (H2, H3 vb.) — yoksa nokta gösterilir. */
  rozet?: string;
  /** Kutu blokları için ikon sınıfı aksanı (info/warning/tip/prompt). */
  ikonData?: "info" | "warning" | "tip" | "prompt" | "kaynak";
  arama: string[];
  komut: (editor: Editor, range: Range) => void;
};

export type SlashSecenek = {
  /** Editördeki görsel yükleme akışını açar. */
  onGorsel: () => void;
};

const slashKey = new PluginKey("slashKomut");

function maddeler(opts: SlashSecenek): SlashItem[] {
  return [
    {
      baslik: "Başlık 2",
      aciklama: "Bölüm başlığı",
      rozet: "H2",
      arama: ["h2", "baslik", "başlık", "heading", "bolum", "bölüm"],
      komut: (e, r) => e.chain().focus().deleteRange(r).setNode("heading", { level: 2 }).run(),
    },
    {
      baslik: "Başlık 3",
      aciklama: "Alt başlık",
      rozet: "H3",
      arama: ["h3", "altbaslik", "alt başlık", "heading"],
      komut: (e, r) => e.chain().focus().deleteRange(r).setNode("heading", { level: 3 }).run(),
    },
    {
      baslik: "Görsel",
      aciklama: "Bilgisayardan görsel yükle",
      rozet: "🖼",
      arama: ["gorsel", "görsel", "resim", "image", "foto"],
      komut: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        opts.onGorsel();
      },
    },
    {
      baslik: "Bilgi",
      aciklama: "Bilgilendirme kutusu",
      ikonData: "info",
      arama: ["bilgi", "info", "kutu"],
      komut: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        blokEkle(e, "infoBlock");
      },
    },
    {
      baslik: "Uyarı",
      aciklama: "Dikkat kutusu",
      ikonData: "warning",
      arama: ["uyari", "uyarı", "dikkat", "warning"],
      komut: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        blokEkle(e, "warningBlock");
      },
    },
    {
      baslik: "Ahmet'in Notu",
      aciklama: "İpucu / kişisel not",
      ikonData: "tip",
      arama: ["not", "ipucu", "ahmet", "tip"],
      komut: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        blokEkle(e, "tipBlock");
      },
    },
    {
      baslik: "Prompt",
      aciklama: "Örnek prompt kartı",
      ikonData: "prompt",
      arama: ["prompt", "komut", "örnek", "ornek"],
      komut: (e, r) => e.chain().focus().deleteRange(r).setNode("promptBlock").run(),
    },
    {
      baslik: "Kaynak",
      aciklama: "Atıf / kaynak kutusu",
      ikonData: "kaynak",
      arama: ["kaynak", "kaynakca", "kaynakça", "atif", "atıf", "referans", "source"],
      komut: (e, r) => {
        e.chain().focus().deleteRange(r).run();
        blokEkle(e, "kaynakBlock");
      },
    },
  ];
}

/* ------------------------------------------------------------- liste --- */

type ListeProps = {
  items: SlashItem[];
  command: (item: SlashItem) => void;
};
export type SlashListeRef = { onKeyDown: (p: SuggestionKeyDownProps) => boolean };

const SlashListe = forwardRef<SlashListeRef, ListeProps>(function SlashListe({ items, command }, ref) {
  const [sec, setSec] = useState(0);
  useEffect(() => setSec(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSec((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSec((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[sec]) command(items[sec]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="min-w-[220px] rounded-[10px] border border-ink/12 bg-white px-3 py-2.5 text-[13px] text-[#9aa0ae] shadow-[0_12px_30px_rgba(10,13,24,0.14)]">
        Sonuç yok
      </div>
    );
  }

  return (
    <div
      role="menu"
      className="max-h-[280px] min-w-[248px] overflow-y-auto rounded-[10px] border border-ink/12 bg-white py-1 shadow-[0_12px_30px_rgba(10,13,24,0.14)]"
    >
      {items.map((item, i) => (
        <button
          key={item.baslik}
          type="button"
          role="menuitem"
          onMouseEnter={() => setSec(i)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command(item)}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
            i === sec ? "bg-brand/[0.08]" : "hover:bg-mist"
          }`}
        >
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-[8px] border text-[12px] font-semibold ${
              i === sec ? "border-brand/30 bg-white text-brand" : "border-ink/12 bg-mist text-[#5C6273]"
            }`}
          >
            {item.ikonData ? (
              <span className={`aea-blok-ikon aea-blok-ikon--${item.ikonData}`} aria-hidden />
            ) : (
              <span>{item.rozet ?? "•"}</span>
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] font-semibold text-ink">{item.baslik}</span>
            <span className="truncate text-[12px] text-[#9aa0ae]">{item.aciklama}</span>
          </span>
        </button>
      ))}
    </div>
  );
});

/* ---------------------------------------------------------- extension --- */

function renderSlash() {
  let component: ReactRenderer<SlashListeRef, ListeProps> | null = null;
  let popup: TippyInstance | null = null;

  return {
    onStart: (props: SuggestionProps<SlashItem>) => {
      component = new ReactRenderer(SlashListe, {
        props: { items: props.items, command: props.command },
        editor: props.editor,
      });
      if (!props.clientRect) return;
      popup = tippy(document.body, {
        getReferenceClientRect: props.clientRect as GetReferenceClientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        // Admin başlığı z-40; menü onun üstünde ama yan menünün (z-50) altında.
        zIndex: 45,
      });
    },
    onUpdate: (props: SuggestionProps<SlashItem>) => {
      component?.updateProps({ items: props.items, command: props.command });
      if (props.clientRect && popup) {
        popup.setProps({ getReferenceClientRect: props.clientRect as GetReferenceClientRect });
      }
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === "Escape") {
        popup?.hide();
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      popup?.destroy();
      component?.destroy();
      popup = null;
      component = null;
    },
  };
}

export const SlashKomut = Extension.create<SlashSecenek>({
  name: "slashKomut",

  addOptions() {
    return { onGorsel: () => {} };
  },

  addProseMirrorPlugins() {
    const secenek = this.options;
    const suggestion: Omit<SuggestionOptions<SlashItem>, "editor"> = {
      char: "/",
      pluginKey: slashKey,
      // Yalnızca paragrafta: kod/prompt/kutu başlıkları slash menüsünü açmasın.
      allow: ({ state, range }) => {
        const $from = state.doc.resolve(range.from);
        return $from.parent.type.name === "paragraph";
      },
      items: ({ query }) => {
        const q = query.toLocaleLowerCase("tr").trim();
        const hepsi = maddeler(secenek);
        if (!q) return hepsi;
        return hepsi.filter((m) => m.arama.some((a) => a.includes(q)) || m.baslik.toLocaleLowerCase("tr").includes(q));
      },
      command: ({ editor, range, props }) => {
        props.komut(editor, range);
      },
      render: renderSlash,
    };

    return [Suggestion({ editor: this.editor, ...suggestion })];
  },
});
