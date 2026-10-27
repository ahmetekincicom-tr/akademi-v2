"use client";

import { useState } from "react";
import { BlogSimge } from "@/components/blog/BlogSimge";

/**
 * "Paylaş" satırı: WhatsApp, LinkedIn, X ve bağlantıyı kopyala. Kaynak:
 * ahmetekinci.com.tr ShareButtons.astro.
 *
 * Paylaşım bağlantıları sıradan <a>: JavaScript'siz de çalışıyor. Kopyala
 * düğmesi panoya yazıyor ve sonucu ekran okuyucuya duyuruyor. Her düğme
 * 44×44 px (dokunma alanı).
 */
export function PaylasimDugmeleri({ url, baslik }: { url: string; baslik: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const adres = encodeURIComponent(url);
  const baglantilar = [
    { ad: "whatsapp" as const, etiket: "WhatsApp'ta paylaş", href: `https://wa.me/?text=${encodeURIComponent(`${baslik} ${url}`)}` },
    { ad: "linkedin" as const, etiket: "LinkedIn'de paylaş", href: `https://www.linkedin.com/sharing/share-offsite/?url=${adres}` },
    { ad: "x" as const, etiket: "X'te paylaş", href: `https://x.com/intent/post?url=${adres}&text=${encodeURIComponent(baslik)}` },
  ];
  const dugme =
    "grid h-11 w-11 place-items-center rounded-full border border-ink/15 bg-white text-ink transition hover:border-brand hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setKopyalandi(true);
      window.setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // Pano izni yoksa adres çubuğu duruyor; sessizce geçiliyor.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mr-1 font-mono text-[11px] font-semibold tracking-[0.1em] text-[#5C6273] uppercase">Paylaş</span>
      {baglantilar.map((b) => (
        <a
          key={b.ad}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${b.etiket} (yeni sekmede açılır)`}
          data-paylasim={b.ad}
          className={dugme}
        >
          <BlogSimge ad={b.ad} boyut={17} />
        </a>
      ))}
      <button
        type="button"
        onClick={kopyala}
        aria-label="Bağlantıyı kopyala"
        className={`${dugme} ${kopyalandi ? "border-brand bg-brand text-white" : ""}`}
      >
        <BlogSimge ad={kopyalandi ? "tamam" : "link"} boyut={17} />
      </button>
      <span className="sr-only" aria-live="polite">
        {kopyalandi ? "Bağlantı kopyalandı" : ""}
      </span>
    </div>
  );
}
