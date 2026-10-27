"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { yaziSurumleri, type YaziSurumu } from "@/app/kontrol-9f4x2k/(protected)/blog/actions";

/**
 * Yazının önceki hâlleri.
 *
 * Sürümleri veritabanı tetikleyicisi yazıyor (başlık, özet ya da içerik her
 * değiştiğinde eski hâl). "Editöre yükle" yalnızca formu dolduruyor; kalıcı
 * olması için Kaydet'e basmak gerekiyor ve o kayıt şimdiki hâli de geçmişe
 * yazıyor — yani geri yükleme de geri alınabilir.
 */

const DURUM_AD: Record<string, string> = { yayin: "Yayında", taslak: "Taslak", zamanli: "Zamanlı" };

function tarihSaat(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(iso));
}

function duzMetin(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function SurumGecmisi({ postId, onGeriYukle }: { postId: string; onGeriYukle: (s: YaziSurumu) => void }) {
  const [acik, setAcik] = useState(false);
  const [surumler, setSurumler] = useState<YaziSurumu[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const baslikId = useId();

  useEffect(() => {
    if (!acik) return;
    let iptal = false;
    void yaziSurumleri(postId).then((r) => {
      if (iptal) return;
      if (r.error) setHata(r.error);
      else setSurumler(r.surumler ?? []);
    });
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", tus);
    return () => {
      iptal = true;
      window.removeEventListener("keydown", tus);
    };
  }, [acik, postId]);

  const secilen = surumler?.find((s) => s.id === secili) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSurumler(null);
          setHata(null);
          setSecili(null);
          setAcik(true);
        }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[11px] border border-ink/13 bg-white text-[14px] font-semibold text-ink hover:border-brand/45 hover:text-brand"
      >
        <Icon name="clock" size={16} />
        Sürüm geçmişi
      </button>

      {acik && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={baslikId}>
          <button type="button" aria-label="Kapat" onClick={() => setAcik(false)} className="absolute inset-0 bg-ink/45" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col bg-white shadow-[-18px_0_40px_rgba(10,13,24,0.18)]">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-ink/8 px-5 py-3">
              <h2 id={baslikId} className="font-heading text-[18px] font-semibold tracking-[-0.02em]">
                Sürüm geçmişi
              </h2>
              <button
                type="button"
                onClick={() => setAcik(false)}
                aria-label="Kapat"
                className="grid h-11 w-11 place-items-center rounded-[10px] text-[#5C6273] hover:bg-mist"
              >
                <Icon name="x" size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {hata && <p className="text-[14px] text-danger">Sürümler yüklenemedi: {hata}</p>}
              {!hata && !surumler && <p className="text-[14px] text-[#5C6273]">Yükleniyor…</p>}
              {surumler && surumler.length === 0 && (
                <p className="text-[14px] leading-[1.6] text-[#5C6273]">
                  Henüz önceki bir sürüm yok. Başlık, özet ya da içerik değiştirilip kaydedildikçe eski hâller burada
                  birikir (yazı başına son 100).
                </p>
              )}
              {surumler && surumler.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {surumler.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSecili(secili === s.id ? null : s.id)}
                        aria-expanded={secili === s.id}
                        className={`flex min-h-[44px] w-full flex-col items-start gap-0.5 rounded-[11px] border px-3.5 py-2.5 text-left transition ${
                          secili === s.id ? "border-brand bg-brand/[0.04]" : "border-ink/10 hover:border-ink/25"
                        }`}
                      >
                        <span className="font-mono text-[11px] tracking-[0.04em] text-[#6B7080]">
                          {tarihSaat(s.tarih)} · {DURUM_AD[s.durum] ?? s.durum}
                        </span>
                        <span className="text-[14.5px] font-semibold text-ink">{s.baslik}</span>
                      </button>
                      {secili === s.id && secilen && (
                        <div className="mt-2 rounded-[11px] bg-mist p-3.5">
                          {secilen.ozet && <p className="text-[13.5px] leading-[1.55] text-[#3D4252]">{secilen.ozet}</p>}
                          <p className="mt-2 line-clamp-6 text-[13px] leading-[1.6] text-[#5C6273]">
                            {duzMetin(secilen.icerikHtml) || "(içerik boş)"}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              onGeriYukle(secilen);
                              setAcik(false);
                            }}
                            className="mt-3 h-11 rounded-[10px] bg-brand px-4 text-[14px] font-semibold text-white hover:bg-ink"
                          >
                            Bu sürümü editöre yükle
                          </button>
                          <p className="mt-2 text-[12px] text-[#6B7080]">
                            Yalnızca form dolar. Kalıcı olması için Kaydet&apos;e bas.
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
