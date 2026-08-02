"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { Oynatma } from "@/lib/oynatma";

/**
 * Tamamlanmış seansın kişiye özel kaydı. Oynatıcı katlanır durumda: seans
 * listesi çoğu zaman takvim gibi taranıyor, her satırda açık bir video
 * sayfayı boğardı.
 *
 * "Kaynağında aç" bağlantısı bilerek duruyor — Drive gömme, ziyaretçinin
 * Google oturumuna göre bazen boş kare veriyor; öğrenci o durumda kaydı
 * yeni sekmede yine izleyebilsin.
 */
export function SeansKaydi({ video, kaynak, baslik }: { video: Oynatma; kaynak: string; baslik: string }) {
  const [acik, setAcik] = useState(false);
  // Klasör tek bir video değil, dosya listesi: etiketler ve yükseklik farklı.
  const klasorMu = video.tip === "klasor";

  return (
    <div className="order-5 basis-full sm:order-none">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAcik((v) => !v)}
          aria-expanded={acik}
          className="inline-flex h-9 w-fit items-center gap-[6px] rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name={acik ? "x" : klasorMu ? "folder" : "play"} size={14} />
          {acik
            ? klasorMu
              ? "Kayıtları kapat"
              : "Kaydı kapat"
            : klasorMu
              ? "Kayıtları aç"
              : "Kaydı izle"}
        </button>
        <a
          href={kaynak}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-fit items-center gap-[6px] rounded-[9px] px-[11px] font-mono text-[11px] text-[#656B7A] transition hover:text-ink"
        >
          <Icon name="external" size={13} />
          Kaynağında aç
        </a>
      </div>

      {acik && (
        <div
          className={`mt-3 overflow-hidden rounded-[14px] ring-1 ring-ink/12 ${
            klasorMu ? "bg-white" : "bg-ink"
          }`}
        >
          {klasorMu ? (
            // Klasör listesi: en boy oranı yerine sabit yükseklik, çünkü
            // içerik video değil dosya listesi.
            <iframe src={video.src} title={baslik} className="h-[420px] w-full border-0" />
          ) : video.tip === "iframe" ? (
            <iframe
              src={video.src}
              title={baslik}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full border-0"
            />
          ) : (
            <video src={video.src} controls className="aspect-video w-full bg-ink" />
          )}
        </div>
      )}
    </div>
  );
}
