"use client";

import { useEffect, useSyncExternalStore } from "react";
import { IZIN_CEREZI, IZIN_DEGISTI, cerezdenOku } from "@/lib/izin";
import { oaiqBaslat } from "@/lib/oaiq";

/**
 * OpenAI (ChatGPT) Ads pikseli.
 *
 * MetaPixel'in aynısı: reklam izni verilmeden HİÇBİR ŞEY yüklenmiyor (script
 * bile). init sayfa yüklemesini kendisi ölçüyor; asıl dönüşüm sinyali WhatsApp
 * tıklamasında (lib/olay.ts → oaiqOlcum "lead_created").
 *
 * İzin sonradan verilirse bileşen kendini yeniden değerlendiriyor (IZIN_DEGISTI
 * olayına abone): bandı kapattıktan sonra sayfayı yenilemek gerekmiyor.
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

/** Sunucuda izin bilinmiyor; piksel hiçbir zaman sunucu çiziminde başlamıyor. */
function sunucudaOku(): string {
  return "";
}

export function OpenAiPixel() {
  // Değeri kullanılmıyor; izin değiştiğinde efekti yeniden çalıştırmak için.
  const kayitli = useSyncExternalStore(izneAbone, izniOku, sunucudaOku);

  useEffect(() => {
    // İzin ve GPC kontrolü oaiqBaslat içinde, tek yerde.
    oaiqBaslat();
  }, [kayitli]);

  return null;
}
