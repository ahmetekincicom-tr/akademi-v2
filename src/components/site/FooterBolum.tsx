"use client";

import { useSyncExternalStore, type ReactNode } from "react";

/** Tailwind'in `sm` kırılımı; footer'ın tek sütundan çok sütuna geçtiği yer. */
const GENIS = "(min-width: 640px)";

function abone(yenile: () => void) {
  const sorgu = window.matchMedia(GENIS);
  sorgu.addEventListener("change", yenile);
  return () => sorgu.removeEventListener("change", yenile);
}

/**
 * Footer'daki bir bağlantı sütunu. Dar ekranda açılır kapanır, geniş ekranda
 * her zaman açık.
 *
 * Mobilde üç sütun alt alta iniyordu ve footer, sayfanın kendisinden uzun bir
 * bağlantı listesine dönüşüyordu: dibe inmek isteyen kişi yirmi bağlantının
 * içinden geçmek zorundaydı.
 *
 * `<details>` seçildi: kapalıyken de bağlantılar DOM'da kalıyor, yani arama
 * motoru hepsini görüyor. Sunucu anlık görüntüsü AÇIK — JavaScript çalışmadan
 * gelen ziyaretçi (ve tarayıcı) listeyi tam görüyor; daraltma yalnızca dar
 * ekranda ve bağlandıktan sonra oluyor.
 *
 * Geniş ekranda başlık tıklanamıyor (pointer-events yok): orada kapatılabilir
 * olması, bir sütunun kaybolup düzende boşluk bırakması demekti.
 */
export function FooterBolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  const genisEkran = useSyncExternalStore(
    abone,
    () => window.matchMedia(GENIS).matches,
    () => true,
  );

  return (
    <details
      open={genisEkran}
      className="group border-b border-white/10 pb-3 last:border-b-0 sm:border-b-0 sm:pb-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-center gap-[10px] py-2 sm:pointer-events-none sm:justify-start sm:py-0 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-white/55 uppercase">{baslik}</span>
        <span className="font-mono text-[15px] leading-none text-white/45 sm:hidden">
          <span className="hidden group-open:inline">–</span>
          <span className="group-open:hidden">+</span>
        </span>
      </summary>
      <div className="mt-4 flex flex-col items-center gap-[11px] pb-2 sm:mt-[18px] sm:items-start sm:pb-0">
        {children}
      </div>
    </details>
  );
}
