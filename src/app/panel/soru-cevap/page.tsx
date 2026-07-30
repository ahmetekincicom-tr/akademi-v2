"use client";

import { useState } from "react";

type Mesaj = { kim: "ben" | "ahmet"; metin: string; saat: string };
type Konu = { baslik: string; durum: "açık" | "yanıtlandı" | "kapandı"; tarih: string; mesajlar: Mesaj[] };

const konuData: Konu[] = [
  {
    baslik: "Advantage+ kampanyada bütçe dağılımı",
    durum: "açık",
    tarih: "Bugün 09:14",
    mesajlar: [
      { kim: "ben", metin: "Advantage+ kampanyada bütçeyi kitle seti seviyesinde ayarlayamıyorum, normal mi?", saat: "Dün 21:40" },
      {
        kim: "ahmet",
        metin: "Normal. Advantage+ tek bir bütçe havuzu kullanıyor; dağıtımı algoritma yapıyor. Kontrol istiyorsan manuel kampanyaya geçmen gerekir.",
        saat: "Bugün 09:14",
      },
    ],
  },
  {
    baslik: "Pixel olayları iki kez sayıyor",
    durum: "yanıtlandı",
    tarih: "26 Temmuz",
    mesajlar: [
      { kim: "ben", metin: "Satın alma olayı hem pixel hem CAPI'den geliyor, rapor şişiyor.", saat: "25 Temmuz" },
      {
        kim: "ahmet",
        metin: "Event ID'leri eşleştirmen gerekiyor. Modül 2'deki deduplication dersini tekrar izle, sonra ekran paylaşımıyla bakalım.",
        saat: "26 Temmuz",
      },
    ],
  },
  {
    baslik: "Reels için kreatif ölçüsü",
    durum: "kapandı",
    tarih: "18 Temmuz",
    mesajlar: [
      { kim: "ben", metin: "Reels ve feed için tek kreatif yeterli mi?", saat: "18 Temmuz" },
      {
        kim: "ahmet",
        metin: "Yerleşim başına ayrı kesim kullan; feed 4:5, Reels 9:16. Şablonu kütüphaneye ekledim.",
        saat: "18 Temmuz",
      },
    ],
  },
];

const durumStil: Record<Konu["durum"], { bg: string; renk: string }> = {
  açık: { bg: "rgba(28,86,243,0.12)", renk: "#1C56F3" },
  yanıtlandı: { bg: "rgba(10,13,24,0.06)", renk: "#3A3F4F" },
  kapandı: { bg: "rgba(10,13,24,0.06)", renk: "#9CA1AE" },
};

export default function SoruCevapPage() {
  const [aktifKonu, setAktifKonu] = useState(0);
  const [mesaj, setMesaj] = useState("");
  const konu = konuData[aktifKonu];

  return (
    <main className="p-[34px] pb-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
            Soru-cevap
          </h1>
          <p className="mt-2 text-[15px] text-[#5C6273]">
            Eğitim bittikten sonra da açık kalan destek kanalı. Yanıtlar genelde aynı gün içinde gelir.
          </p>
        </div>
        <button type="button" className="h-11 rounded-[10px] bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-ink">
          Yeni soru aç
        </button>
      </div>

      <div className="mt-[26px] grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[340px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-5 py-4 font-mono text-[10.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
            Konularım
          </div>
          {konuData.map((k, i) => (
            <button
              key={k.baslik}
              type="button"
              onClick={() => setAktifKonu(i)}
              className="w-full border-b border-ink/7 px-5 py-4 text-left last:border-b-0 hover:bg-[#F5F8FF]"
              style={{ background: aktifKonu === i ? "#EEF3FF" : "#FFFFFF" }}
            >
              <div className="flex items-center justify-between gap-[10px]">
                <span
                  className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.1em] uppercase"
                  style={{ background: durumStil[k.durum].bg, color: durumStil[k.durum].renk }}
                >
                  {k.durum}
                </span>
                <span className="font-mono text-[10px] text-[#9CA1AE]">{k.tarih}</span>
              </div>
              <div className="mt-[10px] text-[14.5px] leading-[1.4] font-semibold">{k.baslik}</div>
            </button>
          ))}
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-6 py-5">
            <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">{konu.baslik}</h2>
            <div className="mt-[5px] font-mono text-[10.5px] text-[#8A8F9E]">
              {konu.tarih} · {konu.durum}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 bg-mist p-6">
            {konu.mesajlar.map((m, i) => (
              <div key={i} className="flex" style={{ justifyContent: m.kim === "ben" ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-[78%] rounded-[14px] border px-[17px] py-[15px]"
                  style={{
                    background: m.kim === "ben" ? "#1C56F3" : "#FFFFFF",
                    color: m.kim === "ben" ? "#FFFFFF" : "#2B303D",
                    borderColor: m.kim === "ben" ? "#1C56F3" : "rgba(10,13,24,0.11)",
                  }}
                >
                  <div
                    className="font-mono text-[10px] tracking-[0.08em]"
                    style={{ color: m.kim === "ben" ? "rgba(255,255,255,0.65)" : "#8A8F9E" }}
                  >
                    {m.kim === "ben" ? "Selin" : "Ahmet Ekinci"} · {m.saat}
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.6]">{m.metin}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-3 border-t border-ink/8 px-6 py-[18px]">
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              placeholder="Yanıtını yaz..."
              className="min-h-16 flex-1 resize-y rounded-[11px] border border-ink/13 bg-white px-[14px] py-3 text-[14.5px] leading-[1.55] text-ink outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={() => setMesaj("")}
              className="h-[46px] flex-none rounded-[10px] bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-ink"
            >
              Gönder
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
