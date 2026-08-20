"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { IZIN_CEREZI, IZIN_DEGISTI, cerezdenOku } from "@/lib/izin";
import { pixelOlay, pixeliBaslat } from "@/lib/meta/tarayici";

/**
 * Meta pixel'i.
 *
 * Sunucu tarafı (CAPI) satın almayı ve teklif formunu taşıyor; bu bileşenin
 * işi tarayıcıda kalan iki şey: sayfa görüntüleme ve program inceleme. Onlar
 * kitle oluşturmanın temeli ve sunucudan üretilemiyorlar.
 *
 * İzin verilmeden HİÇBİR ŞEY yüklenmiyor — script bile. Meta'nın betiği
 * yüklendiği anda çerez yazıyor; "yükle ama ateşleme" diye bir orta yol yok.
 *
 * İzin sonradan verilirse bileşen kendini yeniden değerlendiriyor: bandı
 * kapattıktan sonra sayfayı yenilemek gerekmiyor.
 */

function izneAbone(geriCagir: () => void) {
  window.addEventListener(IZIN_DEGISTI, geriCagir);
  return () => window.removeEventListener(IZIN_DEGISTI, geriCagir);
}

function izniOku(): string {
  try {
    return cerezdenOku(document.cookie, IZIN_CEREZI) ?? "";
  } catch {
    return "";
  }
}

/** Sunucuda izin bilinmiyor; pixel hiçbir zaman sunucu çiziminde başlamıyor. */
function sunucudaOku(): string {
  return "";
}

export function MetaPixel({ pixelId }: { pixelId: string }) {
  // Değeri kullanılmıyor; izin değiştiğinde efekti yeniden çalıştırmak için.
  const kayitli = useSyncExternalStore(izneAbone, izniOku, sunucudaOku);
  const yol = usePathname();

  useEffect(() => {
    // İzin ve GPC kontrolü pixeliBaslat içinde, tek yerde.
    if (!pixeliBaslat(pixelId)) return;

    // Her gezinmede yeniden: App Router'da sayfa değişimi tam sayfa yüklemesi
    // değil, dolayısıyla fbevents.js kendiliğinden PageView atmıyor.
    pixelOlay("PageView");
  }, [kayitli, pixelId, yol]);

  return null;
}
