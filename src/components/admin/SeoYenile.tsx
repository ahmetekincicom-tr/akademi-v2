"use client";

import { useTransition } from "react";
import { useBildirim } from "@/components/Bildirim";
import { seoYenile } from "@/app/kontrol-9f4x2k/(protected)/seo-performans/actions";

/** "Verileri yenile": site SEO önbelleğini (GSC + GA4) temizleyip sayfayı tazeler. */
export function SeoYenile() {
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  return (
    <button
      type="button"
      disabled={islemde}
      onClick={() =>
        basla(async () => {
          const r = await seoYenile();
          if (r.error) bildir.hata(r.error);
          else bildir.basarili("Veriler yenilendi.");
        })
      }
      className="flex h-[38px] items-center rounded-[9px] border border-ink/14 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
    >
      {islemde ? "Yenileniyor…" : "Verileri yenile"}
    </button>
  );
}
