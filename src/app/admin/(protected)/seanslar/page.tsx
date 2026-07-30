"use client";

import { useState } from "react";
import { randevularData } from "@/lib/admin/data";

const gunler: [string, string][] = [
  ["Pzt", "3 Ağu"],
  ["Sal", "4 Ağu"],
  ["Çar", "5 Ağu"],
  ["Per", "6 Ağu"],
  ["Cum", "7 Ağu"],
];
const saatler = ["10:00", "11:30", "14:00", "16:00", "18:30"];
const dolu = ["Sal-14:00", "Per-11:30"];

export default function AdminSeanslarPage() {
  const [kapaliSlot, setKapaliSlot] = useState<string[]>(["Pzt-18:30", "Çar-10:00"]);

  const toggle = (id: string) => {
    setKapaliSlot((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id)));
  };

  return (
    <main className="p-7 pb-14">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Seans takvimi
      </h1>
      <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
        Müsaitlik saatlerini aç/kapa; öğrenciler yalnızca açık slotlardan randevu alabilir.
      </p>

      <div className="mt-[22px] grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-[22px] py-[18px]">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">3–7 Ağustos</h2>
            <div className="flex items-center gap-[14px]">
              <span className="font-mono text-[10px] text-[#8A8F9E]">tıkla: açık / kapalı</span>
              <div className="flex gap-[7px]">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-ink/13 bg-white text-[#3A3F4F] hover:border-brand hover:text-brand"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-ink/13 bg-white text-[#3A3F4F] hover:border-brand hover:text-brand"
                >
                  →
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3 px-[22px] py-5 pb-6">
            {gunler.map(([gun, tarih]) => (
              <div key={gun}>
                <div className="border-b border-ink/8 pb-[11px] text-center">
                  <div className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">{gun}</div>
                  <div className="mt-[5px] text-[14.5px] font-semibold">{tarih}</div>
                </div>
                <div className="mt-[11px] flex flex-col gap-[7px]">
                  {saatler.map((s) => {
                    const id = `${gun}-${s}`;
                    const doluMu = dolu.includes(id);
                    const kapali = kapaliSlot.includes(id);
                    const etiket = doluMu ? "dolu" : kapali ? "kapalı" : "açık";
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={doluMu}
                        onClick={() => toggle(id)}
                        className="flex h-11 flex-col items-center justify-center gap-[2px] rounded-[9px] border font-mono text-[11.5px] font-medium disabled:cursor-not-allowed"
                        style={{
                          background: doluMu ? "#1C56F3" : kapali ? "#F2F4FA" : "#FFFFFF",
                          color: doluMu ? "#FFFFFF" : kapali ? "#B4B8C2" : "#0A0D18",
                          borderColor: doluMu ? "#1C56F3" : kapali ? "rgba(10,13,24,0.08)" : "rgba(28,86,243,0.35)",
                        }}
                      >
                        <span>{s}</span>
                        <span className="text-[9px] tracking-[0.06em] opacity-80">{etiket}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-5 py-[18px]">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Yaklaşan randevular</h2>
          </div>
          {randevularData.map((r) => (
            <div key={r.zaman + r.isim} className="border-b border-ink/7 px-5 py-[15px] last:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-brand">{r.zaman}</span>
                <span className="font-mono text-[10px] text-[#9CA1AE]">{r.sure}</span>
              </div>
              <div className="mt-2 text-[14.5px] font-semibold">{r.isim}</div>
              <div className="mt-[3px] text-[12.5px] text-[#5C6273]">{r.konu}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
