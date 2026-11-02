"use client";

import { useCallback, useEffect, useState } from "react";
import { useNativeUygulama } from "@/lib/native";

type Asama = "bekliyor" | "gorunur" | "kayboluyor" | "bitti";

// Katman sadece devir teslimi kapatıyor, gösterilecek bir şeyi yok: native
// görsel zaten sayfa yüklenene kadar bekledi. Kısa tutuluyor.
const GORUNME_SURESI = 260;
const SOLMA_SURESI = 260;

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
 * görünmüyor. Sonra katman solar ve panel ortaya çıkar.
 *
 * Animasyon YOK, bilerek: açılış görseli sabit duruyor, tek hareket sondaki
 * solma. Katman olmasaydı native görsel ile panel arasında boş bir kare
 * kalırdı; tek işi o boşluğu kapatmak.
 *
 * Ölçüler vh cinsinden, tesadüfen değil: iOS kare açılış görselini ekranı
 * kaplayacak şekilde ölçeklerken dikey kenarı taban alıyor. Kare yüksekliğinin
 * %12,5'i olan simge, ekran yüksekliğinin de %12,5'ine denk geliyor. Aynı
 * oranı burada kullanınca simge her telefonda aynı yerde ve aynı boyutta
 * kalıyor.
 *
 * Görsel, uygulama simgesinin yuvarlak köşeli hâli; native açılış görseli
 * (ios/App/App/Assets.xcassets/Splash.imageset) aynı kaynaktan aynı oranla
 * üretiliyor. Biri değişirse öteki de değişmeli, yoksa devirde simge zıplar.
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
        src="/acilis-logo.webp"
        alt=""
        onLoad={hazir}
        onError={hazir}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: "50%", height: "12.5vh", width: "12.5vh" }}
      />
    </div>
  );
}
