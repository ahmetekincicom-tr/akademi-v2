"use client";

import { useCallback, useEffect, useState } from "react";
import { useNativeUygulama } from "@/lib/native";

type Asama = "bekliyor" | "gorunur" | "kayboluyor" | "bitti";

// Çubuk bir tur atsın; hemen kaybolan yükleme göstergesi tedirgin edici.
const GORUNME_SURESI = 750;
const SOLMA_SURESI = 320;

/**
 * Uygulamanın animasyonlu açılış katmanı.
 *
 * NEDEN VAR: iOS'un açılış ekranı statik olmak zorunda. Sistem onu uygulama
 * daha çalışmaya başlamadan gösteriyor; ne animasyon, ne kod, ne de yükleme
 * durumu koyulabiliyor. Hareketli bir açılış istiyorsak tek yol, aynı
 * tasarımı uygulamanın içinde yeniden çizip devri teslim almak.
 *
 * DEVIR TESLİM: native görsel, biz hazır olana kadar ekranda kalıyor
 * (launchAutoHide bir güvenlik tavanı). Logomuz boyanır boyanmaz native
 * görseli gizliyoruz — altında zaten birebir aynısı duruyor, o yüzden geçiş
 * görünmüyor. Sonra çubuk döner, katman solar, panel ortaya çıkar.
 *
 * Ölçüler vh cinsinden, tesadüfen değil: iOS kare açılış görselini ekranı
 * kaplayacak şekilde ölçeklerken dikey kenarı taban alıyor. Kare yüksekliğinin
 * %25,6'sı olan logo, ekran yüksekliğinin de %25,6'sına denk geliyor. Aynı
 * oranı burada kullanınca logo her telefonda aynı yerde ve aynı boyutta
 * kalıyor.
 */
export function AcilisEkrani() {
  const native = useNativeUygulama();
  const [asama, setAsama] = useState<Asama>("bekliyor");

  const hazir = useCallback(() => {
    setAsama((o) => (o === "bekliyor" ? "gorunur" : o));
  }, []);

  // Logomuz ekrana geldi; native görseli çekebiliriz.
  useEffect(() => {
    if (asama !== "gorunur") return;

    let iptal = false;
    void (async () => {
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // Eklenti yoksa native görsel zaten yok; katman kendi başına çalışır.
      }
    })();

    const t = setTimeout(() => {
      if (!iptal) setAsama("kayboluyor");
    }, GORUNME_SURESI);

    return () => {
      iptal = true;
      clearTimeout(t);
    };
  }, [asama]);

  useEffect(() => {
    if (asama !== "kayboluyor") return;
    const t = setTimeout(() => setAsama("bitti"), SOLMA_SURESI);
    return () => clearTimeout(t);
  }, [asama]);

  // Logo hiç yüklenemezse katman ekranda kalmasın.
  useEffect(() => {
    if (!native || asama !== "bekliyor") return;
    const t = setTimeout(hazir, 2000);
    return () => clearTimeout(t);
  }, [native, asama, hazir]);

  if (!native || asama === "bitti") return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] bg-[#FBFBFD] transition-opacity duration-300"
      style={{ opacity: asama === "kayboluyor" ? 0 : 1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Açılışta ek bir
          işlem katmanı istemiyoruz: görsel olduğu gibi, anında boyanmalı. */}
      <img
        src="/acilis-logo.svg"
        alt=""
        onLoad={hazir}
        onError={hazir}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: "50%", height: "25.6vh", width: "25.6vh" }}
      />
      <div
        className="acilis-cubuk absolute left-1/2 -translate-x-1/2"
        style={{ top: "76.9vh", width: "22.7vh", height: "0.42vh", minHeight: 3 }}
      />
    </div>
  );
}
