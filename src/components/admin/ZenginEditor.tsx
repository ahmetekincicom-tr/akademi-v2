"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { depoUrl } from "@/lib/depo";
import { LinkSecici, type LinkSecim } from "@/components/admin/LinkSecici";
import type { IcLinkHedef } from "@/lib/yazilar";

/**
 * Zengin metin editörü (TipTap).
 *
 * Kaynak belge JSON olarak tutuluyor (kayıpsız düzenleme), herkese açık render
 * için HTML de birlikte üretiliyor. İkisini de değişimde yukarı bildiriyor;
 * kaydeden form ikisini de veritabanına yazıyor.
 *
 * Araç çubuğu ikon yerine kısa metin etiketleri kullanıyor: projenin ikon seti
 * editör simgelerini (kalın, liste vb.) içermiyor ve 11 SVG eklemek yerine
 * yönetim ekranında net metin etiketleri yeterli.
 *
 * Next SSR ile hidrasyon uyuşmazlığı olmasın diye immediatelyRender: false.
 */

type Deger = { html: string; json: unknown };

function AracDugmesi({
  aktif,
  onTikla,
  etiket,
  children,
}: {
  aktif?: boolean;
  onTikla: () => void;
  etiket: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onTikla}
      aria-label={etiket}
      title={etiket}
      className={`flex h-9 min-w-9 items-center justify-center rounded-[8px] border px-2 text-[13px] font-semibold transition ${
        aktif
          ? "border-brand bg-brand/10 text-brand"
          : "border-ink/12 bg-white text-[#5C6273] hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

function Ayrac() {
  return <span className="mx-1 h-5 w-px bg-ink/12" />;
}

function htmlKacir(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function ZenginEditor({
  baslangicJson,
  baslangicHtml = "",
  icHedefler = [],
  onDegisim,
}: {
  baslangicJson: unknown;
  /**
   * JSON boşsa/geçersizse başlangıç içeriği bu HTML'den kuruluyor. WordPress'ten
   * taşınan yazılarda icerik_json boş ('{}'); içerik yalnızca icerik_html'de
   * duruyor. Bu olmadan taşınan bir yazı editörde boş açılır ve kaydedince
   * içerik silinirdi.
   */
  baslangicHtml?: string;
  icHedefler?: IcLinkHedef[];
  onDegisim: (d: Deger) => void;
}) {
  const dosyaGirdi = useRef<HTMLInputElement>(null);
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [linkAcik, setLinkAcik] = useState(false);

  // Geçerli bir ProseMirror belgesi varsa onu kullan; yoksa HTML'den kur.
  // TipTap `content` hem JSON belge hem HTML string kabul ediyor.
  const gecerliDoc =
    baslangicJson && typeof baslangicJson === "object" && (baslangicJson as { type?: string }).type
      ? (baslangicJson as object)
      : baslangicHtml || "";

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ HTMLAttributes: { class: "blog-gorsel" } }),
      Placeholder.configure({ placeholder: "Yazmaya başla…" }),
    ],
    content: gecerliDoc,
    editorProps: {
      attributes: { class: "blog-icerik min-h-[360px] px-4 py-4 outline-none" },
    },
    onUpdate: ({ editor }) => onDegisim({ html: editor.getHTML(), json: editor.getJSON() }),
  });

  const linkUygula = (s: LinkSecim) => {
    if (!editor) return;
    setLinkAcik(false);
    const bos = editor.state.selection.empty;
    if (bos) {
      // Seçili metin yoksa hedefin başlığını (ya da URL'yi) bağlı metin olarak ekle.
      const metin = s.baslik ?? s.url;
      const oz = s.ic ? "" : ' target="_blank" rel="noopener noreferrer"';
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${htmlKacir(s.url)}"${oz}>${htmlKacir(metin)}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: s.url, target: s.ic ? null : "_blank", rel: s.ic ? null : "noopener noreferrer" })
        .run();
    }
  };

  const linkKaldir = () => {
    if (!editor) return;
    setLinkAcik(false);
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const gorselSec = useCallback(
    async (dosya: File | undefined) => {
      if (!dosya || !editor) return;
      if (!dosya.type.startsWith("image/")) {
        window.alert("Yalnızca görsel yükleyebilirsin.");
        return;
      }
      setGorselYukleniyor(true);
      const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
      const yol = `blog/${Date.now()}-${temizAd}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("kapaklar").upload(yol, dosya, { cacheControl: "3600" });
      setGorselYukleniyor(false);
      if (error) {
        window.alert(`Görsel yüklenemedi: ${error.message}`);
        return;
      }
      const url = depoUrl("kapaklar", yol);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
    [editor],
  );

  if (!editor) {
    return <div className="min-h-[420px] rounded-[12px] border border-ink/12 bg-mist" />;
  }

  return (
    <div className="overflow-hidden rounded-[12px] border border-ink/12 bg-white">
      <div className="flex flex-wrap items-center gap-[6px] border-b border-ink/10 bg-mist px-3 py-2">
        <AracDugmesi etiket="Kalın" aktif={editor.isActive("bold")} onTikla={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </AracDugmesi>
        <AracDugmesi etiket="İtalik" aktif={editor.isActive("italic")} onTikla={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Başlık 2" aktif={editor.isActive("heading", { level: 2 })} onTikla={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </AracDugmesi>
        <AracDugmesi etiket="Başlık 3" aktif={editor.isActive("heading", { level: 3 })} onTikla={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Madde listesi" aktif={editor.isActive("bulletList")} onTikla={() => editor.chain().focus().toggleBulletList().run()}>
          •
        </AracDugmesi>
        <AracDugmesi etiket="Numaralı liste" aktif={editor.isActive("orderedList")} onTikla={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </AracDugmesi>
        <AracDugmesi etiket="Alıntı" aktif={editor.isActive("blockquote")} onTikla={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Bağlantı" aktif={editor.isActive("link")} onTikla={() => setLinkAcik(true)}>
          🔗
        </AracDugmesi>
        <AracDugmesi etiket={gorselYukleniyor ? "Yükleniyor…" : "Görsel ekle"} onTikla={() => dosyaGirdi.current?.click()}>
          {gorselYukleniyor ? "…" : "🖼"}
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Geri al" onTikla={() => editor.chain().focus().undo().run()}>
          ↶
        </AracDugmesi>
        <AracDugmesi etiket="Yinele" onTikla={() => editor.chain().focus().redo().run()}>
          ↷
        </AracDugmesi>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={dosyaGirdi}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          void gorselSec(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {linkAcik && (
        <LinkSecici
          hedefler={icHedefler}
          mevcutUrl={(editor.getAttributes("link").href as string | undefined) || undefined}
          onSec={linkUygula}
          onKaldir={linkKaldir}
          onKapat={() => setLinkAcik(false)}
        />
      )}
    </div>
  );
}
