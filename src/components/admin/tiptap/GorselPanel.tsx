"use client";

import type { Editor } from "@tiptap/react";
import { boyutMetni } from "@/lib/gorsel-optimize";

/**
 * Seçili blog görselinin ayar paneli.
 *
 * Editörde bir `blogGorsel` seçildiğinde görünür; alt metin, caption, dekoratif
 * ve lightbox alanlarını node attribute'larına yazar. Alt text ile caption
 * bilinçli olarak AYRI: alt `<img alt>`'a (erişilebilirlik/görsel arama),
 * caption `<figcaption>`'a (okuyucuya görünür açıklama) gidiyor; biri
 * diğerinden otomatik üretilmiyor.
 */
export function GorselPanel({ editor }: { editor: Editor }) {
  if (!editor.isActive("blogGorsel")) return null;

  const a = editor.getAttributes("blogGorsel") as {
    src?: string;
    alt?: string;
    caption?: string;
    width?: number | null;
    height?: number | null;
    lightboxEnabled?: boolean;
    decorative?: boolean;
    mimeType?: string | null;
    fileSize?: number | null;
    originalFilename?: string | null;
  };

  const guncelle = (yama: Record<string, unknown>) =>
    editor.chain().focus(undefined, { scrollIntoView: false }).updateAttributes("blogGorsel", yama).run();

  const altBos = !a.decorative && !(a.alt ?? "").trim();
  const format = a.mimeType?.split("/")[1]?.toUpperCase() ?? (a.src?.split(".").pop()?.toUpperCase() || "—");
  const dosyaAdi = a.src ? a.src.split("/").pop() ?? "" : "";
  const dosyaAdiSeo = /^[a-z0-9-]+\.[a-z0-9]+$/.test(dosyaAdi);

  return (
    <div className="border-b border-ink/10 bg-white px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-[0.02em] text-[#5C6273]">Görsel ayarları</span>
        <span className="font-mono text-[11px] text-[#9aa0ae]">
          {a.width && a.height ? `${a.width}×${a.height}` : ""}
        </span>
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {/* Alt metin */}
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] font-medium text-ink">Alt metin</span>
          <textarea
            rows={2}
            value={a.alt ?? ""}
            disabled={a.decorative}
            onChange={(e) => guncelle({ alt: e.target.value })}
            placeholder="Görselde ne olduğunu kısa ve doğal şekilde açıklayın"
            className="resize-y rounded-[8px] border border-ink/14 bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-brand disabled:bg-mist disabled:text-[#9aa0ae]"
          />
          <span className="text-[11.5px] text-[#8A90A0]">
            Alt metin erişilebilirlik ve görsel arama için kullanılır; caption&apos;dan farklıdır.
          </span>
          {altBos && (
            <span className="text-[11.5px] font-medium text-[#b9791a]">
              Alt metin eklenmedi. Dekoratifse aşağıdaki kutuyu işaretleyin.
            </span>
          )}
        </label>

        {/* Caption */}
        <label className="flex flex-col gap-1">
          <span className="text-[12.5px] font-medium text-ink">Caption (görünür açıklama)</span>
          <textarea
            rows={2}
            value={a.caption ?? ""}
            onChange={(e) => guncelle({ caption: e.target.value })}
            placeholder="İsteğe bağlı; görselin altında gösterilir"
            className="resize-y rounded-[8px] border border-ink/14 bg-white px-2.5 py-2 text-[13.5px] outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            checked={a.decorative ?? false}
            onChange={(e) => guncelle({ decorative: e.target.checked })}
          />
          Bu görsel dekoratif (alt boş kalabilir)
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            checked={a.lightboxEnabled ?? false}
            onChange={(e) => guncelle({ lightboxEnabled: e.target.checked })}
          />
          Tıklayınca büyüt (lightbox)
        </label>
      </div>

      {/* Görsel SEO durum göstergesi — sade. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[8px] bg-mist px-3 py-2 text-[12px] text-[#5C6273]">
        <span className="font-semibold text-[#3A3F4F]">Görsel SEO</span>
        <span>Alt metin: {a.decorative ? "dekoratif" : altBos ? "eksik" : "✓"}</span>
        <span>Dosya adı: {dosyaAdiSeo ? "✓" : "—"}</span>
        <span>Caption: {(a.caption ?? "").trim() ? "✓" : "opsiyonel"}</span>
        {a.fileSize ? <span>Boyut: {boyutMetni(a.fileSize)}</span> : null}
        <span>Format: {format}</span>
        {a.width && a.height ? <span>Çözünürlük: {a.width}×{a.height}</span> : null}
      </div>
    </div>
  );
}
