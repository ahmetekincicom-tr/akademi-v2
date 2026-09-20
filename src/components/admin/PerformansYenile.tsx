"use client";

import { useTransition } from "react";
import { useBildirim } from "@/components/Bildirim";
import { ga4Yenile } from "@/app/kontrol-9f4x2k/(protected)/blog/[slug]/performans/actions";

/** "Verileri yenile": GA4 önbelleğini temizleyip sayfayı tazeler. */
export function PerformansYenile() {
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  return (
    <button
      type="button"
      disabled={islemde}
      onClick={() =>
        basla(async () => {
          const r = await ga4Yenile();
          if (r.error) bildir.hata(r.error);
          else bildir.basarili("Veriler yenilendi.");
        })
      }
      className="rounded-[9px] border border-ink/14 bg-white px-3 py-2 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
    >
      {islemde ? "Yenileniyor…" : "Verileri yenile"}
    </button>
  );
}
