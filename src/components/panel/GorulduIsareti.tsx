"use client";

import { useEffect, useRef } from "react";
import { alaniGorulduIsaretle } from "@/app/panel/gorulme-actions";
import type { GorulmeAlani } from "@/lib/bildirimler";

/**
 * Bölüm açıldığında rozeti düşürür. Çizilecek bir şeyi yok.
 *
 * Bir kere çalışıyor: React 18 geliştirme modunda effect'leri iki kez
 * çağırıyor ve bayrak olmasa aynı yazma iki kez gidiyordu. Sonuç aynı
 * olurdu ama gereksiz bir tur.
 *
 * Hata yutuluyor: rozetin sıfırlanmaması sayfayı bozmamalı, kullanıcının
 * göreceği bir şey de değil.
 */
export function GorulduIsareti({ alan }: { alan: GorulmeAlani }) {
  const yazildi = useRef(false);

  useEffect(() => {
    if (yazildi.current) return;
    yazildi.current = true;
    void alaniGorulduIsaretle(alan).catch(() => {});
  }, [alan]);

  return null;
}
