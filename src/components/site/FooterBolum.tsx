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
      className="group border-b border-white/[0.08] last:border-b-0 sm:border-b-0"
    >
      {/*
        Başlık SOLDA, işaret SAĞDA — dokunulacak alan satırın tamamı.
        Ortalanmış bir akordiyon başlığı, tıklanabilir olduğunu da hangi
        listeye ait olduğunu da belirsizleştiriyordu.
      */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[15px] sm:pointer-events-none sm:py-0 [&::-webkit-details-marker]:hidden">
        {/* Başlık, altındaki bağlantılardan belirgin şekilde ayrışıyor: daha
            iri, daha kalın ve daha parlak. Eskiden 10.5px soluk gri bir
            etiketti; listenin bir parçası gibi okunuyordu. */}
        <span className="font-mono text-[12.5px] font-semibold tracking-[0.14em] text-white/85 uppercase">
          {baslik}
        </span>
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-[7px] border border-white/12 font-mono text-[13px] leading-none text-white/50 transition group-open:border-white/20 sm:hidden">
          <span className="hidden group-open:inline">–</span>
          <span className="group-open:hidden">+</span>
        </span>
      </summary>
      <div className="flex flex-col gap-[13px] pb-[18px] sm:mt-[18px] sm:gap-[11px] sm:pb-0">{children}</div>
    </details>
  );
}
