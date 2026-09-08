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
 *
 * Çağrı BOYAMADAN SONRAYA erteleniyor. Eylem rozeti düşürdüğünde sunucuda
 * revalidatePath çalışıyor ve bu, yönlendiriciyi güncelliyor; doğrudan
 * efektin içinden tetiklenince o güncelleme React'in insertion-effect
 * evresine denk gelip "useInsertionEffect must not schedule updates"
 * hatasına yol açıyordu (panelde iki sayfada, her cihazda görülüyordu).
 * Bir kare beklemek güncellemeyi güvenli evreye taşıyor; kullanıcı
 * açısından fark yok, rozet yine anında düşüyor.
 */
export function GorulduIsareti({ alan }: { alan: GorulmeAlani }) {
  const yazildi = useRef(false);

  useEffect(() => {
    if (yazildi.current) return;
    yazildi.current = true;
    const kare = requestAnimationFrame(() => {
      void alaniGorulduIsaretle(alan).catch(() => {});
    });
    return () => cancelAnimationFrame(kare);
  }, [alan]);

  return null;
}
