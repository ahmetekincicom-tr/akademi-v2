"use client";

import { useMemo, useState } from "react";
import type { IcLinkHedef } from "@/lib/yazilar";

/**
 * Bağlantı seçici: editörde link eklerken açılan küçük pencere.
 *
 * İki sekme: İç sayfa (site içi hedeflerden ara-seç) ve Dış bağlantı (URL yaz).
 * İç bağlantı doğru adresi otomatik girer — SEO için kaleye ("Meta Business
 * Eğitimi" sayfası) doğru iç link vermenin kolay yolu bu.
 */

export type LinkSecim = { url: string; ic: boolean; baslik?: string };

export function LinkSecici({
  hedefler,
  mevcutUrl,
  onSec,
  onKaldir,
  onKapat,
}: {
  hedefler: IcLinkHedef[];
  mevcutUrl?: string;
  onSec: (s: LinkSecim) => void;
  onKaldir: () => void;
  onKapat: () => void;
}) {
  const [sekme, setSekme] = useState<"ic" | "dis">("ic");
  const [arama, setArama] = useState("");
  const [disUrl, setDisUrl] = useState(mevcutUrl && !mevcutUrl.startsWith("/") ? mevcutUrl : "https://");

  const suzulmus = useMemo(() => {
    const a = arama.trim().toLocaleLowerCase("tr");
    if (!a) return hedefler;
    return hedefler.filter(
      (h) => h.baslik.toLocaleLowerCase("tr").includes(a) || h.url.toLocaleLowerCase("tr").includes(a),
    );
  }, [arama, hedefler]);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/40 p-4 pt-[10vh]" onClick={onKapat}>
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-[16px] border border-ink/10 bg-white shadow-[0_30px_70px_rgba(10,13,24,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 border-b border-ink/10 p-2">
          <button
            type="button"
            onClick={() => setSekme("ic")}
            className={`flex-1 rounded-[9px] py-2 text-[13.5px] font-semibold transition ${
              sekme === "ic" ? "bg-brand/10 text-brand" : "text-[#5C6273] hover:bg-mist"
            }`}
          >
            İç sayfa
          </button>
          <button
            type="button"
            onClick={() => setSekme("dis")}
            className={`flex-1 rounded-[9px] py-2 text-[13.5px] font-semibold transition ${
              sekme === "dis" ? "bg-brand/10 text-brand" : "text-[#5C6273] hover:bg-mist"
            }`}
          >
            Dış bağlantı
          </button>
        </div>

        {sekme === "ic" ? (
          <div className="p-3">
            <input
              autoFocus
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Eğitim, yazı veya sayfa ara…"
              className="h-[42px] w-full rounded-[10px] border border-ink/14 bg-white px-[13px] text-[14px] outline-none focus:border-brand"
            />
            <div className="mt-2 max-h-[46vh] overflow-y-auto">
              {suzulmus.length === 0 && (
                <div className="px-2 py-6 text-center text-[13px] text-[#8A90A0]">Sonuç yok.</div>
              )}
              {suzulmus.map((h) => (
                <button
                  key={`${h.grup}-${h.url}`}
                  type="button"
                  onClick={() => onSec({ url: h.url, ic: true, baslik: h.baslik })}
                  className="flex w-full items-center justify-between gap-3 rounded-[9px] px-3 py-[10px] text-left transition hover:bg-mist"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-ink">{h.baslik}</span>
                    <span className="block truncate font-mono text-[11px] text-[#8A90A0]">{h.url}</span>
                  </span>
                  <span className="flex-none rounded-full bg-ink/[0.06] px-2 py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#656B7A] uppercase">
                    {h.grup}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <label className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Adres (URL)</label>
            <input
              autoFocus
              value={disUrl}
              onChange={(e) => setDisUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && disUrl.trim()) onSec({ url: disUrl.trim(), ic: false });
              }}
              placeholder="https://ornek.com"
              className="mt-2 h-[46px] w-full rounded-[10px] border border-ink/14 bg-white px-[13px] text-[14px] outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={() => disUrl.trim() && onSec({ url: disUrl.trim(), ic: false })}
              className="mt-3 h-[44px] w-full rounded-[10px] bg-brand text-[14px] font-semibold text-white hover:bg-ink"
            >
              Bağla
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3">
          {mevcutUrl ? (
            <button type="button" onClick={onKaldir} className="text-[13px] font-semibold text-[#5C6273] hover:text-danger">
              Bağlantıyı kaldır
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={onKapat} className="text-[13px] font-semibold text-[#5C6273] hover:text-ink">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
