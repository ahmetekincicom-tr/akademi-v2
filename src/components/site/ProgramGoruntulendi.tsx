"use client";

import { useEffect } from "react";
import { pixelOlay } from "@/lib/meta/tarayici";

/**
 * Eğitim sayfası açıldığında Meta'ya ViewContent.
 *
 * Hangi programın ilgi çektiğini gösteren tek sinyal bu: teklif formuna
 * kadar gelen kişi sayısı az, sayfayı açan çok. Yeniden hedefleme kitlesi de
 * buradan kuruluyor.
 *
 * Olay tarayıcıdan gidiyor çünkü sunucudan üretilemez: sayfayı kimin
 * gördüğünü ancak tarayıcıdaki çerez söylüyor. İzin kontrolü pixelOlay
 * içinde — burada tekrar edilseydi iki kural iki farklı yerde yaşardı.
 */
export function ProgramGoruntulendi({ baslik }: { baslik: string }) {
  useEffect(() => {
    pixelOlay("ViewContent", { content_name: baslik, content_type: "product" });
  }, [baslik]);

  return null;
}
