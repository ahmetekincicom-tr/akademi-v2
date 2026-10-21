"use client";

import { useEffect, useRef } from "react";

/**
 * iyzico'nun gömülü ödeme formu.
 *
 * Abonelik formu bir yönlendirme adresi değil, sayfaya konacak bir HTML + betik
 * parçası döndürüyor (checkoutFormContent). React'in innerHTML'i betikleri
 * ÇALIŞTIRMIYOR; bu yüzden betikler ayıklanıp yeni <script> öğeleri olarak
 * ekleniyor. Kart alanları iyzico'nun çerçevesinde; kart verisi bu sayfaya da
 * sunucuya da hiç uğramıyor.
 *
 * iyzico betiği kendini "bir kez" kuruyor (typeof iyziInit == 'undefined').
 * Aynı oturumda ikinci bir form açıldığında (iptal → yeniden abone ol, kart
 * güncelleme) eski kurulum kalırsa form hiç çizilmiyor; o yüzden iyzi* ile
 * başlayan globaller her açılışta temizleniyor.
 */
export function IyzicoFormu({ icerik }: { icerik: string }) {
  const kap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hedef = kap.current;
    if (!hedef) return;

    const pencere = window as unknown as Record<string, unknown>;
    for (const ad of Object.keys(pencere)) if (ad.startsWith("iyzi")) delete pencere[ad];

    const sablon = document.createElement("div");
    sablon.innerHTML = icerik;
    const betikler = Array.from(sablon.querySelectorAll("script"));
    betikler.forEach((b) => b.remove());
    hedef.replaceChildren(...Array.from(sablon.childNodes));

    const eklenen = betikler.map((b) => {
      const yeni = document.createElement("script");
      yeni.type = b.type || "text/javascript";
      if (b.src) yeni.src = b.src;
      else yeni.text = b.textContent ?? "";
      document.body.appendChild(yeni);
      return yeni;
    });

    return () => {
      eklenen.forEach((s) => s.remove());
      hedef.replaceChildren();
    };
  }, [icerik]);

  // iyzico formu bu kimlikli öğeye çiziyor. İçerik öğeyi kendisi getiriyorsa
  // ikincisi eklenmiyor: aynı kimlikten iki tane olunca form ilkine, boş
  // olanına çizilebiliyor.
  const hedefVar = icerik.includes("iyzipay-checkout-form");

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#E6E8EF] bg-white p-2 sm:p-4">
      {!hedefVar && <div id="iyzipay-checkout-form" className="responsive" />}
      <div ref={kap} />
    </div>
  );
}
