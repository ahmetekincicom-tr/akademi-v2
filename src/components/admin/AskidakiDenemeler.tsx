"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { denemeSorgula } from "@/app/kontrol-9f4x2k/(protected)/odemeler/actions";
import { para, saatBicimi } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type AskidaDeneme = {
  id: string;
  isim: string;
  tutar: number;
  tarih: string;
  /** iyzico'nun dönüş isteği bize ulaştı mı? */
  callbackGeldi: boolean;
  tokenVar: boolean;
};

/**
 * Sonucu belli olmamış ödeme denemeleri.
 *
 * Bu listenin varlık sebebi: dönüş isteği kaybolduğunda para çekilmiş ama
 * kayıt "bekliyor" kalmış olabiliyor ve bunu yöneticinin fark etmesinin başka
 * yolu yok. "iyzico'ya sor" düğmesi tek doğru kaynağa danışıp kaydı düzeltiyor.
 */
export function AskidakiDenemeler({ denemeler }: { denemeler: AskidaDeneme[] }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  const [calisan, setCalisan] = useState<string | null>(null);

  if (denemeler.length === 0) return null;

  const sor = (id: string) => {
    setCalisan(id);
    basla(async () => {
      const r = await denemeSorgula(id);
      setCalisan(null);
      if (r.error) bildir.hata(r.error);
      else if (r.sonuc === "basarili") bildir.basarili(r.mesaj!);
      else bildir.bilgi(r.mesaj!);
      router.refresh();
    });
  };

  return (
    <section className="mt-[22px] overflow-hidden rounded-2xl border border-[#E0A21C]/40 bg-[#FDF9F0]">
      <div className="border-b border-[#E0A21C]/25 px-[22px] py-[15px]">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Sonucu belli olmayan ödemeler</h2>
        <p className="mt-1 max-w-[640px] text-[13px] leading-[1.55] text-[#7A6220]">
          Öğrenci ödeme sayfasına gitti ama sonuç bize ulaşmadı. Vazgeçmiş olabilir — ya da ödeme geçmiş olabilir.
          Emin olmak için iyzico&apos;ya sor.
        </p>
      </div>

      {denemeler.map((d) => (
        <div
          key={d.id}
          className="flex flex-wrap items-center gap-4 border-b border-[#E0A21C]/18 px-[22px] py-[13px] last:border-b-0"
        >
          <div className="min-w-0 grow basis-[220px]">
            <div className="truncate text-sm font-semibold">{d.isim}</div>
            <div className="mt-[2px] font-mono text-[10.5px] text-[#7A6220]">
              {saatBicimi.format(new Date(d.tarih))} ·{" "}
              {d.callbackGeldi ? "iyzico geri döndü" : "iyzico geri dönmedi"}
            </div>
          </div>
          <div className="flex-none font-heading text-[15px] font-semibold">{para(d.tutar)}</div>
          <button
            type="button"
            disabled={islemde || !d.tokenVar}
            onClick={() => sor(d.id)}
            title={d.tokenVar ? undefined : "Bu denemede token yok; iyzico sayfası hiç açılmamış."}
            className="flex h-9 flex-none items-center gap-[7px] rounded-[9px] bg-ink px-[14px] text-[13px] font-semibold text-white transition hover:bg-brand disabled:opacity-45"
          >
            <Icon name="search" size={14} />
            {calisan === d.id ? "Soruluyor…" : "iyzico'ya sor"}
          </button>
        </div>
      ))}
    </section>
  );
}
