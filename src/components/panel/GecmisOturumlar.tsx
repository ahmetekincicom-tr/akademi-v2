"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { Oynatma } from "@/lib/oynatma";

export type GecmisSatir = {
  id: string;
  tarih: string;
  saat: string;
  konu: string;
  alt: string;
  sureDk: number;
  durum: "tamamlandi" | "iptal" | "planlandi";
  /** Oturuma özel kayıt; yoksa ortak klasör bağlantısı gösteriliyor. */
  kayit: { video: Oynatma | null; kaynak: string } | null;
};

const DURUM = {
  tamamlandi: { etiket: "Tamamlandı", renk: "#12825A", zemin: "#E3F6EE" },
  iptal: { etiket: "İptal", renk: "#5B6478", zemin: "#EEF0F5" },
  // Saati geçmiş ama yönetimde henüz "tamamlandı" işaretlenmemiş oturum.
  planlandi: { etiket: "İşleniyor", renk: "#9A6A00", zemin: "#FFF4D6" },
} as const;

/**
 * Geçmiş oturumlar. "Kaydı izle" oynatıcıyı satırın altında açıyor (sayfadan
 * çıkmadan); gömülemeyen kaynakta yeni sekmede açılıyor. Oturuma özel kayıt
 * yoksa ortak kayıt klasörüne gidiliyor — kayıtlar orada toplanıyor.
 */
export function GecmisOturumlar({ liste, klasor }: { liste: GecmisSatir[]; klasor: string | null }) {
  const [acik, setAcik] = useState<string | null>(null);
  const tamamlanan = liste.filter((s) => s.durum === "tamamlandi").length;
  const izgara = "grid grid-cols-[150px_minmax(0,1fr)_90px_120px_150px] gap-3";

  return (
    <section className="flex flex-col overflow-hidden rounded-[18px] border border-[#E6E8EF] bg-white">
      <div className="flex items-center gap-2.5 px-[18px] pt-4 pb-2.5 sm:px-[22px]">
        <h2 className="text-[16px] font-bold text-ink">Geçmiş oturumlar</h2>
        <span className="ml-auto rounded-full bg-[#F1F3F8] px-2 py-[3px] font-mono text-[10px] text-[#8A92A6] uppercase lg:ml-0">
          <span className="lg:hidden">{liste.length}</span>
          <span className="hidden lg:inline">{tamamlanan} tamamlandı</span>
        </span>
      </div>

      <div className={`${izgara} hidden border-b border-[#EEF0F5] px-[22px] py-2 font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase lg:grid`}>
        <div>Tarih</div>
        <div>Konu</div>
        <div>Süre</div>
        <div>Durum</div>
        <div className="text-right">Kayıt</div>
      </div>

      <ul>
        {liste.map((s) => {
          const d = DURUM[s.durum];
          const kaynak = s.kayit?.kaynak ?? klasor;
          const gomulu = s.kayit?.video ?? null;
          const ac = () => setAcik((a) => (a === s.id ? null : s.id));

          const kayitDugmesi = (mobil: boolean) =>
            s.durum === "iptal" || !kaynak ? (
              <span className="text-[13px] text-[#A6ABB8]">—</span>
            ) : gomulu ? (
              <button
                type="button"
                onClick={ac}
                aria-expanded={acik === s.id}
                aria-label={mobil ? `${s.konu} kaydını izle` : undefined}
                className={
                  mobil
                    ? "flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EEF2FF] text-brand"
                    : "flex items-center gap-2 rounded-[9px] border border-[#E1E4EC] px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                }
              >
                <Icon name={acik === s.id ? "x" : "play"} size={mobil ? 15 : 12} />
                {!mobil && (acik === s.id ? "Kapat" : "Kaydı izle")}
              </button>
            ) : (
              <a
                href={kaynak}
                target="_blank"
                rel="noreferrer"
                aria-label={mobil ? `${s.konu} kaydı` : undefined}
                className={
                  mobil
                    ? "flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EEF2FF] text-brand"
                    : "flex items-center gap-2 rounded-[9px] border border-[#E1E4EC] px-3 py-2 text-[12px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                }
              >
                <Icon name="play" size={mobil ? 15 : 12} />
                {!mobil && (s.kayit ? "Kaydı izle" : "Kayıt klasörü")}
              </a>
            );

          return (
            <li key={s.id} className="border-b border-[#F1F3F7] last:border-b-0">
              <div className={`${izgara} hidden items-center px-[22px] py-3.5 hover:bg-[#F8F9FC] lg:grid`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-ink">{s.tarih}</span>
                  <span className="font-mono text-[11px] text-[#8A92A6]">{s.saat}</span>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[14px] font-semibold text-ink">{s.konu}</span>
                  <span className="truncate text-[12px] text-[#5B6478]">{s.alt}</span>
                </div>
                <div className="font-mono text-[13px] text-[#5B6478]">{s.sureDk} dk</div>
                <span
                  className="justify-self-start rounded-full px-2 py-1 font-mono text-[10px] tracking-[0.08em] uppercase"
                  style={{ color: d.renk, background: d.zemin }}
                >
                  {d.etiket}
                </span>
                <div className="justify-self-end">{kayitDugmesi(false)}</div>
              </div>

              <div className="flex items-center gap-3 px-[18px] py-3 lg:hidden">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-[1.3] font-bold text-ink">{s.konu}</span>
                  <span className="font-mono text-[11px] text-[#8A92A6]">
                    {s.tarih} · {s.sureDk} dk{s.durum !== "tamamlandi" ? ` · ${d.etiket}` : ""}
                  </span>
                </div>
                {kayitDugmesi(true)}
              </div>

              {acik === s.id && gomulu && (
                <div className="px-[18px] pb-4 sm:px-[22px]">
                  <div className={`overflow-hidden rounded-[14px] ring-1 ring-ink/12 ${gomulu.tip === "klasor" ? "bg-white" : "bg-ink"}`}>
                    {gomulu.tip === "klasor" ? (
                      <iframe src={gomulu.src} title={s.konu} className="h-[420px] w-full border-0" />
                    ) : gomulu.tip === "iframe" ? (
                      <iframe
                        src={gomulu.src}
                        title={s.konu}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="aspect-video w-full border-0"
                      />
                    ) : (
                      <video src={gomulu.src} controls className="aspect-video w-full bg-ink" />
                    )}
                  </div>
                  <a
                    href={kaynak ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-[#656B7A] hover:text-ink"
                  >
                    <Icon name="external" size={12} />
                    Kaynağında aç
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
