"use client";

import { useEffect } from "react";
import { useNativeUygulama } from "@/lib/native";

/**
 * Sayfa native uygulamada çalışıyorsa <html> üzerine data-native="1" koyuyor.
 *
 * Böylece uygulamaya özel düzeltmeler CSS'te `[data-native="1"] ...` ile
 * yazılabiliyor ve web tarafı hiç etkilenmiyor. env(safe-area-inset-*)
 * kendiliğinden webde sıfır dönüyor ama overscroll gibi davranışların
 * ayrıca ayrılması gerekiyor.
 */
export function NativeIsaretci() {
  const native = useNativeUygulama();

  useEffect(() => {
    const kok = document.documentElement;
    if (native) kok.dataset.native = "1";
    else delete kok.dataset.native;
  }, [native]);

  return null;
}
