"use client";

import { useEffect } from "react";

/**
 * Service worker olmadan tarayıcı uygulamayı "kurulabilir" saymıyor; ana
 * ekrana ekleme daveti de çıkmıyor. Kayıt sayfa yüklendikten sonra yapılıyor
 * ki ilk açılışı yavaşlatmasın.
 */
export function ServiceWorkerKaydi() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const kaydet = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Kurulum başarısızsa site normal çalışmaya devam eder; sessizce geç.
      });
    };
    if (document.readyState === "complete") kaydet();
    else window.addEventListener("load", kaydet, { once: true });
  }, []);

  return null;
}
