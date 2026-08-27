"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { cerezdenOku } from "@/lib/izin";

/**
 * "Bu sayfayı yalnızca sen görüyorsun" şeridi.
 *
 * Ön yüz kapalıyken tanıtım sayfaları yalnızca izinli kullanıcıya sunuluyor.
 * Şerit olmasa, aylar sonra siteyi gezerken yayında sanmak çok kolay — ve
 * "neden kimse gelmiyor" sorusunun cevabı burada saklı kalırdı.
 *
 * ————————————————————————————————————————————————————————————
 * Durum ÇEREZDEN okunuyor, sunucudan değil.
 *
 * Sunucuda karar verip çizmek headers() ya da cookies() okumak demek ve o,
 * bütün tanıtım sayfalarını statik üretimden düşürüyor. Bu depoda bir kez
 * yapıldı: Speed Insights'ı uygulamada gizlemek için eklenen tek bir
 * nativeIstekMi() çağrısı ana sayfa dahil 13 sayfayı dinamik render'a
 * indirdi. Aynı hataya iki kez düşmeyelim.
 *
 * Çerezi ara katman yazıyor (src/proxy.ts) ve izin kalktığında siliyor.
 */

/** Ara katmanın yazdığı çerez. */
const CEREZ = "aea-onizleme";

/*
  Çerez React'in dışında duruyor; dış kaynak olarak okunuyor. Efekt içinde
  setState çağırmak yerine useSyncExternalStore: sunucu çiziminde şerit hiç
  basılmıyor, dolayısıyla izinsiz ziyaretçide bir an görünüp kaybolmuyor.
  CerezBandi ve MetaPixel de aynı deseni kullanıyor.
*/
function abone() {
  // Çerez sayfa ömrü boyunca değişmiyor; dinlenecek bir olay yok.
  return () => {};
}

function oku(): string {
  try {
    return cerezdenOku(document.cookie, CEREZ) ?? "";
  } catch {
    return "";
  }
}

function sunucudaOku(): string {
  return "";
}

export function OnizlemeSeridi() {
  const gorunur = useSyncExternalStore(abone, oku, sunucudaOku) === "1";
  const yol = usePathname();

  /*
    Panelde ve yönetimde çizilmiyor: çerez alan adı genelinde duruyor ama
    şeridin söylediği şey yalnızca tanıtım sayfaları için doğru. Panel zaten
    yayında.
  */
  const tanitimSayfasi = !yol.startsWith("/panel") && !yol.startsWith("/kontrol-");

  if (!gorunur || !tanitimSayfasi) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[9999] flex flex-wrap items-center justify-center gap-x-2 gap-y-[2px] bg-ink px-4 py-[7px] text-center text-[12.5px] leading-[1.4] text-white"
    >
      <span className="font-semibold">Ön yüz yayında değil.</span>
      <span className="text-white/70">
        Bu sayfayı yalnızca sen görüyorsun; ziyaretçiler giriş ekranına yönlendiriliyor.
      </span>
    </div>
  );
}
