"use client";

import { useSyncExternalStore } from "react";

/**
 * Sayfa native uygulamanın içinde mi çalışıyor?
 *
 * Capacitor WebView'a bir köprü enjekte ediyor; tarayıcıda o köprü yok.
 * Bilgi React'in dışında olduğu için dış kaynak olarak okunuyor: efekt içinde
 * setState çağırmıyoruz ve sunucu render'ında "tarayıcı" varsayıp hidrasyondan
 * sonra gerçek değere geçiyoruz.
 */
type Kapsayici = { Capacitor?: { isNativePlatform?: () => boolean } };

function abone() {
  // Köprü sayfa ömrü boyunca değişmiyor; dinlenecek bir olay yok.
  return () => {};
}

function oku(): boolean {
  const w = window as unknown as Kapsayici;
  return w.Capacitor?.isNativePlatform?.() === true;
}

function sunucudaOku(): boolean {
  return false;
}

export function useNativeUygulama(): boolean {
  return useSyncExternalStore(abone, oku, sunucudaOku);
}
