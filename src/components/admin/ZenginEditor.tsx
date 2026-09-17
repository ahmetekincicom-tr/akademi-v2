"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { depoUrl } from "@/lib/depo";

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

export function ZenginEditor({
  baslangicJson,
  onDegisim,
}: {
  baslangicJson: unknown;
  onDegisim: (d: Deger) => void;
}) {
  const dosyaGirdi = useRef<HTMLInputElement>(null);
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);

  const gecerliDoc =
    baslangicJson && typeof baslangicJson === "object" && (baslangicJson as { type?: string }).type
      ? (baslangicJson as object)
      : "";

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

  const baglantiEkle = useCallback(() => {
    if (!editor) return;
    const mevcut = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Bağlantı adresi (iç sayfa için /blog/... yazabilirsin):", mevcut ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const ic = url.startsWith("/");
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: ic ? null : "_blank", rel: ic ? null : "noopener noreferrer" })
      .run();
  }, [editor]);

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
        <AracDugmesi etiket="Bağlantı" aktif={editor.isActive("link")} onTikla={baglantiEkle}>
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
    </div>
  );
}
