"use client";

import { useState, useTransition } from "react";
import { dokumanIndirmeLinki } from "@/app/admin/(protected)/dokumanlar/actions";
import { baytBoyut, tarihBicimi } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type OgrenciDokuman = {
  id: string;
  baslik: string;
  program: string;
  dosyaYolu: string;
  dosyaTipi: string;
  boyut: number | null;
  tarih: string;
};

export function DokumanListesi({ dokumanlar }: { dokumanlar: OgrenciDokuman[] }) {
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const bildir = useBildirim();

  const indir = (yol: string) => {
    setHata(null);
    startTransition(async () => {
      const r = await dokumanIndirmeLinki(yol);
      if (r.url) window.open(r.url, "_blank");
      else {
        const m = r.error ?? "Bağlantı alınamadı.";
        setHata(m);
        bildir.hata(m);
      }
    });
  };

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Doküman kütüphanesi
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitimlerinde paylaşılan şablonlar, kontrol listeleri ve kaynaklar.
      </p>

      {hata && <div className="mt-4 text-sm text-danger-ink">{hata}</div>}

      {dokumanlar.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#9CA1AE]">
            <Icon name="folder" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Henüz seninle paylaşılmış bir doküman yok. Eğitmenin ders materyali yüklediğinde burada listelenir.
          </p>
        </div>
      ) : (
        <div className="mt-[26px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {dokumanlar.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-4 border-b border-ink/7 px-6 py-[16px] last:border-b-0 hover:bg-[#F7F9FF]"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-mist font-mono text-[10px] font-semibold text-[#5C6273]">
                {d.dosyaTipi.slice(0, 4) || "DOC"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-ink">{d.baslik}</div>
                <div className="mt-1 font-mono text-[10.5px] text-[#8A8F9E]">
                  {d.program} · {baytBoyut(d.boyut)} · {tarihBicimi.format(new Date(d.tarih))}
                </div>
              </div>
              <button
                type="button"
                disabled={islemde}
                onClick={() => indir(d.dosyaYolu)}
                className="inline-flex h-9 flex-none items-center gap-[6px] rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
              >
                <Icon name="download" size={14} />
                İndir
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
