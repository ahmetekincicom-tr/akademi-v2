"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kurumsalSssKaydet } from "@/app/kontrol-9f4x2k/(protected)/kurumsal/actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import type { FaqItem } from "@/lib/courses";

/**
 * Kurumsal eğitim sayfasının SSS düzenleyicisi.
 *
 * Eğitimlerin SSS'i eğitime özel (content.sss) ama kurumsal sayfa tek ve
 * kendi listesi var; oradaki sorular satın alma sürecini, faturayı ve
 * yerinde eğitimi anlatıyor, bir eğitimin kapsamını değil.
 */
export function KurumsalFormu({ sss }: { sss: FaqItem[] }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [liste, setListe] = useState<FaqItem[]>(sss);

  const ekle = () => setListe((p) => p.concat({ soru: "", cevap: "" }));
  const sil = (i: number) => setListe((p) => p.filter((_, j) => j !== i));
  const yaz = (i: number, alan: keyof FaqItem, v: string) =>
    setListe((p) => p.map((s, j) => (j === i ? { ...s, [alan]: v } : s)));
  // Sıra sayfada göründüğü sıra: en çok sorulanı yukarı almak isteniyor.
  const tasi = (i: number, yon: -1 | 1) =>
    setListe((p) => {
      const hedef = i + yon;
      if (hedef < 0 || hedef >= p.length) return p;
      const kopya = p.slice();
      [kopya[i], kopya[hedef]] = [kopya[hedef], kopya[i]];
      return kopya;
    });

  const kaydet = () =>
    startTransition(async () => {
      const r = await kurumsalSssKaydet(liste);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Kurumsal SSS kaydedildi.");
        router.refresh();
      }
    });

  const okStil =
    "flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border border-ink/13 bg-white text-[13px] text-[#656B7A] transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink/13 disabled:hover:text-[#656B7A]";

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Kurumsal sayfası
      </h1>
      <p className="mt-[7px] max-w-[700px] text-[14.5px] text-[#5C6273]">
        /kurumsal sayfasının en altındaki sıkça sorulan sorular. Bu liste yalnızca kurumsal sayfada görünür;
        eğitimlerin kendi SSS listesi eğitim düzenleme ekranından yönetiliyor.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-5">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Sıkça sorulan sorular</h2>
            <p className="mt-[5px] text-[13px] text-[#656B7A]">
              {liste.length === 0 ? "Hiç soru yok" : `${liste.length} soru`}
            </p>
          </div>
          <button
            type="button"
            onClick={ekle}
            className="inline-flex h-[38px] items-center gap-[6px] rounded-[9px] border border-brand/40 bg-brand/[0.07] px-[15px] text-[13.5px] font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            <Icon name="plus" size={14} />
            Soru ekle
          </button>
        </div>

        {liste.map((s, i) => (
          <div key={i} className="flex flex-col gap-[10px] border-b border-ink/8 px-6 py-5 last:border-b-0">
            <div className="flex items-center gap-[11px]">
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] border border-ink/12 bg-mist font-mono text-[11px] font-medium text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                type="text"
                value={s.soru}
                onChange={(e) => yaz(i, "soru", e.target.value)}
                placeholder="Soru — örn. Kaç kişilik ekiplere uygun?"
                className="h-10 min-w-0 flex-1 rounded-[9px] border border-ink/13 bg-white px-[13px] text-[14.5px] font-semibold text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
              />
              <button type="button" onClick={() => tasi(i, -1)} disabled={i === 0} aria-label="Yukarı taşı" className={okStil}>
                ↑
              </button>
              <button
                type="button"
                onClick={() => tasi(i, 1)}
                disabled={i === liste.length - 1}
                aria-label="Aşağı taşı"
                className={okStil}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => sil(i)}
                aria-label="Soruyu sil"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-[8px] border border-ink/13 bg-white text-[#656B7A] transition hover:border-danger/45 hover:text-danger"
              >
                <Icon name="x" size={15} />
              </button>
            </div>
            <textarea
              value={s.cevap}
              onChange={(e) => yaz(i, "cevap", e.target.value)}
              placeholder="Cevap"
              className="ml-[41px] min-h-[86px] resize-y rounded-[9px] border border-ink/12 bg-white px-[13px] py-[10px] text-[14px] leading-[1.6] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
            />
          </div>
        ))}

        {liste.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-[#656B7A]">
            Hiç soru yok. Boş bırakılırsa sayfada hazır liste gösterilir.
          </div>
        )}

        <div className="border-t border-ink/8 bg-mist px-6 py-[13px] text-[12.5px] leading-[1.5] text-[#656B7A]">
          Soru ya da cevabı boş bırakılan satırlar kaydedilmez.
        </div>
      </div>

      <button
        type="button"
        onClick={kaydet}
        disabled={islemde}
        className="mt-5 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:opacity-60"
      >
        {islemde ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </main>
  );
}
