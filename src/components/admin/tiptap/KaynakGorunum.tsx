"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { kaynakBaglanti } from "@/lib/blog-kaynak";

/**
 * Kaynak bloğunun EDİTÖR görünümü (React NodeView).
 *
 * Kart yayındakiyle aynı sınıfları kullanıyor (aea-blok aea-blok--kaynak), yani
 * yazarken gördüğün düzen yayındakine çok yakın; fark yalnızca ad/açıklama/URL
 * alanlarının kartın içinde kenarlıksız girdiler olması. Public HTML bu
 * bileşenden DEĞİL, node'un renderHTML'inden üretiliyor (BlogBloklari.ts).
 */

/**
 * Girdi yerel durumda tutulur (imleç zıplamasın), her değişiklik node
 * attribute'una yazılır. Attribute dışarıdan değişirse (geri al vb.) yerel
 * durum render sırasında eşitlenir — React'in "prop değişince state'i ayarla"
 * deseni.
 */
function Alan({
  deger,
  onDegis,
  className,
  placeholder,
  etiket,
  tip = "text",
  girdiRef,
}: {
  deger: string;
  onDegis: (v: string) => void;
  className: string;
  placeholder: string;
  etiket: string;
  tip?: "text" | "url";
  girdiRef?: Ref<HTMLInputElement>;
}) {
  const [yerel, setYerel] = useState(deger);
  const [onceki, setOnceki] = useState(deger);
  if (deger !== onceki) {
    setOnceki(deger);
    setYerel(deger);
  }
  return (
    <input
      ref={girdiRef}
      type={tip}
      value={yerel}
      aria-label={etiket}
      placeholder={placeholder}
      spellCheck={tip === "text"}
      onChange={(e) => {
        setYerel(e.target.value);
        onDegis(e.target.value);
      }}
      className={className}
    />
  );
}

export function KaynakGorunum({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const ad = (node.attrs.ad as string) ?? "";
  const url = (node.attrs.url as string) ?? "";
  const not = (node.attrs.not as string) ?? "";
  const baglanti = kaynakBaglanti(url);
  const urlHatali = url.trim() !== "" && !baglanti;

  // Boş bir kaynak seçilince (ör. yeni eklendiğinde) ad alanına odaklan.
  const adRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selected && !ad) adRef.current?.focus();
  }, [selected, ad]);

  return (
    <NodeViewWrapper
      as="aside"
      contentEditable={false}
      data-blok="kaynak"
      className={`aea-blok aea-blok--kaynak aea-kaynak--editor ${selected ? "aea-kaynak--secili" : ""}`}
    >
      <div className="aea-blok__ust" data-drag-handle>
        <span className="aea-blok__ikon" aria-hidden />
        <span className="aea-blok__etiket">Kaynak</span>
        <button
          type="button"
          onClick={() => deleteNode()}
          className="aea-kaynak__kaldir"
          aria-label="Kaynak kutusunu kaldır"
          title="Kaldır"
        >
          Kaldır
        </button>
      </div>

      <Alan
        girdiRef={adRef}
        etiket="Kaynak adı"
        deger={ad}
        onDegis={(v) => updateAttributes({ ad: v })}
        placeholder="Kaynak adı (ör. Meta — Conversions API Documentation)"
        className="aea-kaynak__ad aea-kaynak__girdi"
      />
      <Alan
        etiket="Kısa açıklama"
        deger={not}
        onDegis={(v) => updateAttributes({ not: v })}
        placeholder="Kısa açıklama / not (isteğe bağlı)"
        className="aea-kaynak__not aea-kaynak__girdi"
      />

      <div className="aea-kaynak__alt">
        <Alan
          etiket="Kaynak URL'si"
          tip="url"
          deger={url}
          onDegis={(v) => updateAttributes({ url: v })}
          placeholder="https://…"
          className="aea-kaynak__url-girdi"
        />
        {baglanti ? (
          <a className="aea-kaynak__link" href={baglanti.href} target="_blank" rel="noopener noreferrer">
            Kaynağı görüntüle
          </a>
        ) : null}
      </div>
      {urlHatali && (
        <div className="aea-kaynak__uyari" role="status">
          Geçerli bir http(s) adresi girin — geçersiz bağlantı yayında gösterilmez.
        </div>
      )}
    </NodeViewWrapper>
  );
}
