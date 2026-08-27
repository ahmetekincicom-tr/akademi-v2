"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
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
 *
 * ————————————————————————————————————————————————————————————
 * Şerit aynı zamanda MENÜ.
 *
 * PublicHeader ve PublicFooter tanıtım bağlantılarını ON_YUZ_ACIK'a bakarak
 * çiziyor ve o bir derleme zamanı sabiti — kişiye göre değişemiyor. Kişiye
 * göre değişsin diye sunucuda çereze bakmak, bütün tanıtım sayfalarını
 * statiklikten düşürürdü.
 *
 * Bu yüzden bağlantılar buraya kondu: önizleme yapan kişi sayfalar arasında
 * gezebiliyor, gerçek menü ise ön yüz açıldığında olduğu gibi devreye
 * giriyor. Ayrıca doğrusu da bu — bu bir önizleme aracı, sitenin menüsü
 * değil.
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

/** Ön yüz kapalıyken menüde görünmeyen tanıtım sayfaları. */
const SAYFALAR = [
  { yol: "/", ad: "Ana sayfa" },
  { yol: "/egitimler", ad: "Eğitimler" },
  { yol: "/kurumsal", ad: "Kurumsal" },
  { yol: "/hakkimizda", ad: "Hakkımızda" },
  { yol: "/referanslar", ad: "Referanslar" },
  { yol: "/yorumlar", ad: "Yorumlar" },
  { yol: "/iletisim", ad: "İletişim" },
];

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
      className="sticky top-0 z-[9999] flex flex-wrap items-center justify-center gap-x-4 gap-y-[6px] bg-ink px-4 py-[8px] text-[12.5px] leading-[1.4] text-white"
    >
      <span className="flex flex-wrap items-center justify-center gap-x-[6px]">
        <span className="font-semibold">Ön yüz yayında değil.</span>
        <span className="text-white/60">Bu sayfaları yalnızca sen görüyorsun.</span>
      </span>

      <nav className="flex flex-wrap items-center justify-center gap-x-[10px] gap-y-[4px]">
        {SAYFALAR.map((s) => {
          const aktif = yol === s.yol;
          return (
            <Link
              key={s.yol}
              href={s.yol}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-[6px] px-[7px] py-[2px] transition ${
                aktif ? "bg-white/18 font-semibold text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {s.ad}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
