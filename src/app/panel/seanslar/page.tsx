"use client";

import { useState } from "react";

const gunler: [string, string][] = [
  ["Pzt", "4 Ağu"],
  ["Sal", "5 Ağu"],
  ["Çar", "6 Ağu"],
  ["Per", "7 Ağu"],
  ["Cum", "8 Ağu"],
];
const saatler = ["10:00", "11:30", "14:00", "16:00", "18:30"];
const dolu = ["Pzt-11:30", "Sal-14:00", "Çar-10:00", "Çar-16:00", "Per-18:30", "Cum-11:30"];

const gecmisSeanslar = [
  { baslik: "Kampanya kurulum seansı", meta: "18 Temmuz · 60 dk · kayıt mevcut" },
  { baslik: "Pixel ve CAPI kontrolü", meta: "3 Temmuz · 45 dk · kayıt mevcut" },
  { baslik: "Kreatif değerlendirme", meta: "21 Haziran · 30 dk · kayıt mevcut" },
];

export default function BirebirSeanslarPage() {
  const [secilenSlot, setSecilenSlot] = useState<string | null>(null);

  return (
    <main className="p-[34px] pb-14">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Birebir seanslar
      </h1>
      <p className="mt-2 text-[15px] text-[#5C6273]">
        Eğitim paketine dahil birebir seans hakkın: 3 seanstan 2&apos;si kullanıldı.
      </p>

      <div className="mt-[26px] grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-5">
            <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">4–8 Ağustos</h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-ink/13 bg-white text-[#3A3F4F] hover:border-brand hover:text-brand"
              >
                ←
              </button>
              <button
                type="button"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-ink/13 bg-white text-[#3A3F4F] hover:border-brand hover:text-brand"
              >
                →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-[14px] px-6 py-[22px] pb-[26px]">
            {gunler.map(([gun, tarih]) => (
              <div key={gun}>
                <div className="border-b border-ink/8 pb-3 text-center">
                  <div className="font-mono text-[10.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">{gun}</div>
                  <div className="mt-[5px] text-[15px] font-semibold">{tarih}</div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {saatler.map((s) => {
                    const id = `${gun}-${s}`;
                    const doluMu = dolu.includes(id);
                    const secili = secilenSlot === id;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={doluMu}
                        onClick={() => setSecilenSlot(secili ? null : id)}
                        className="h-[38px] rounded-[9px] border font-mono text-xs font-medium disabled:cursor-not-allowed"
                        style={{
                          background: doluMu ? "#F2F4FA" : secili ? "#1C56F3" : "#FFFFFF",
                          color: doluMu ? "#B4B8C2" : secili ? "#FFFFFF" : "#0A0D18",
                          borderColor: doluMu ? "rgba(10,13,24,0.08)" : secili ? "#1C56F3" : "rgba(10,13,24,0.13)",
                          textDecoration: doluMu ? "line-through" : "none",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-brand/30 bg-[#F5F8FF] p-6 px-6 pt-[22px] pb-6">
            <div className="font-mono text-[10px] tracking-[0.14em] text-brand uppercase">Randevu oluştur</div>
            <div className="mt-3 font-heading text-[21px] font-semibold tracking-[-0.025em]">
              {secilenSlot ? secilenSlot.replace("-", " · ") : "Henüz saat seçilmedi"}
            </div>
            <p className="mt-2 text-sm leading-[1.6] text-[#3A3F4F]">
              Seanslar 60 dakika sürer ve Google Meet üzerinden yapılır. Onay e-postası hemen iletilir.
            </p>
            {secilenSlot && (
              <button
                type="button"
                className="mt-[18px] h-[46px] w-full rounded-[10px] bg-brand text-[15px] font-semibold text-white hover:bg-ink"
              >
                Seansı onayla
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="border-b border-ink/8 px-[22px] py-[18px]">
              <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">Geçmiş seanslar</h2>
            </div>
            {gecmisSeanslar.map((s) => (
              <div key={s.baslik} className="flex items-center gap-3 border-b border-ink/7 px-[22px] py-[15px] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold">{s.baslik}</div>
                  <div className="mt-[3px] font-mono text-[10.5px] text-[#8A8F9E]">{s.meta}</div>
                </div>
                <button
                  type="button"
                  className="h-8 flex-none rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
                >
                  Kayıt
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
