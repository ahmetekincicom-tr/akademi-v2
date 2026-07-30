"use client";

import { useMemo, useState } from "react";

type Dosya = { ad: string; tip: string; boyut: string; tarih: string };

const dokumanData: { egitim: string; dosyalar: Dosya[] }[] = [
  {
    egitim: "Birebir Meta Business Eğitimi",
    dosyalar: [
      { ad: "Kampanya bütçe planlama şablonu", tip: "PDF", boyut: "480 KB", tarih: "2 gün önce" },
      { ad: "Aylık reklam raporu şablonu", tip: "Şablon", boyut: "96 KB", tarih: "5 gün önce" },
      { ad: "Pixel kurulum kontrol listesi", tip: "Checklist", boyut: "180 KB", tarih: "2 hafta önce" },
      { ad: "Teklif stratejisi karşılaştırma tablosu", tip: "Şablon", boyut: "74 KB", tarih: "2 hafta önce" },
      { ad: "Ders sunumu · Modül 5", tip: "PDF", boyut: "1,2 MB", tarih: "3 hafta önce" },
    ],
  },
  {
    egitim: "Birebir Sosyal Medya Eğitimi",
    dosyalar: [
      { ad: "Kreatif test kontrol listesi", tip: "Checklist", boyut: "220 KB", tarih: "1 hafta önce" },
      { ad: "İçerik takvimi taslağı", tip: "Şablon", boyut: "68 KB", tarih: "2 hafta önce" },
      { ad: "Hook ve metin kalıpları kılavuzu", tip: "PDF", boyut: "640 KB", tarih: "1 ay önce" },
    ],
  },
  {
    egitim: "Pazarlamada Yapay Zekâ Eğitimi",
    dosyalar: [
      { ad: "Prompt kütüphanesi", tip: "PDF", boyut: "310 KB", tarih: "1 ay önce" },
      { ad: "Otomasyon akış şeması", tip: "Şablon", boyut: "128 KB", tarih: "1 ay önce" },
    ],
  },
];

const tipler = ["Tümü", "PDF", "Şablon", "Checklist"];

export default function DokumanKutuphanesiPage() {
  const [arama, setArama] = useState("");
  const [tip, setTip] = useState("Tümü");

  const gruplar = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return dokumanData
      .map((g) => ({
        egitim: g.egitim,
        dosyalar: g.dosyalar.filter((d) => (tip === "Tümü" || d.tip === tip) && (!q || d.ad.toLowerCase().includes(q))),
      }))
      .filter((g) => g.dosyalar.length);
  }, [arama, tip]);

  const toplam = gruplar.reduce((n, g) => n + g.dosyalar.length, 0);

  return (
    <main className="p-[34px] pb-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
            Doküman kütüphanesi
          </h1>
          <p className="mt-2 text-[15px] text-[#5C6273]">
            Derslerde kullanılan tüm şablon, kontrol listesi ve sunumlar eğitime göre gruplanmış halde.
          </p>
        </div>
        <span className="font-mono text-[11px] tracking-[0.1em] text-[#8A8F9E] uppercase">{toplam} dosya</span>
      </div>

      <div className="mt-[26px] flex flex-wrap items-center gap-3">
        <div className="flex h-11 max-w-[420px] min-w-[260px] flex-1 items-center gap-[9px] rounded-[10px] border border-ink/12 bg-white px-[15px]">
          <span className="font-mono text-xs text-[#9CA1AE]">⌕</span>
          <input
            type="text"
            placeholder="Doküman adı ara"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full border-0 bg-transparent text-[14.5px] text-ink outline-none"
          />
        </div>
        <div className="flex gap-2">
          {tipler.map((t) => {
            const secili = tip === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTip(t)}
                className="h-11 rounded-[10px] border px-4 text-sm font-semibold hover:border-brand"
                style={{
                  background: secili ? "#0A0D18" : "#FFFFFF",
                  color: secili ? "#FFFFFF" : "#3A3F4F",
                  borderColor: secili ? "#0A0D18" : "rgba(10,13,24,0.13)",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {gruplar.map((g) => (
          <div key={g.egitim} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-[18px]">
              <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">{g.egitim}</h2>
              <button
                type="button"
                className="h-9 rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
              >
                Tümünü indir
              </button>
            </div>
            {g.dosyalar.map((d) => (
              <div key={d.ad} className="flex items-center gap-[14px] border-b border-ink/7 px-6 py-[15px] last:border-b-0 hover:bg-[#F7F9FF]">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] text-center font-mono text-[9px] leading-[1.1] font-medium text-brand">
                  {d.tip}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{d.ad}</div>
                  <div className="mt-[3px] font-mono text-[10.5px] text-[#8A8F9E]">
                    {d.boyut} · {d.tarih}
                  </div>
                </div>
                <button
                  type="button"
                  className="h-[34px] flex-none rounded-[8px] border border-ink/13 bg-white px-[14px] text-[13px] font-semibold text-ink hover:border-brand hover:bg-brand hover:text-white"
                >
                  İndir
                </button>
              </div>
            ))}
          </div>
        ))}

        {toplam === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/18 bg-white p-14 px-6 text-center">
            <div className="mx-auto flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-[#F2F4FA] text-lg text-[#9CA1AE]">
              ⌕
            </div>
            <div className="mt-[18px] font-heading text-xl font-semibold tracking-[-0.02em]">
              Bu aramaya uygun doküman yok
            </div>
            <p className="mx-auto mt-2 max-w-[380px] text-[14.5px] leading-[1.6] text-[#5C6273]">
              Filtreyi sıfırlayıp tüm kütüphaneye dönebilir ya da eksik bir doküman için destek talebi açabilirsin.
            </p>
            <button
              type="button"
              onClick={() => {
                setArama("");
                setTip("Tümü");
              }}
              className="mt-5 h-11 rounded-[10px] bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-ink"
            >
              Filtreyi sıfırla
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
