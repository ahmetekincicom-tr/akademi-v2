"use client";

import { useState } from "react";
import { odemeData as odemeDataInitial } from "@/lib/admin/data";
import { StatusBadge } from "@/lib/admin/shared";

const filtreler = ["Tümü", "Ödendi", "Onay bekliyor", "İade edildi"];

const odemeKpi = [
  { etiket: "Bu ay tahsil", deger: "184.200 ₺", alt: "7 işlem" },
  { etiket: "Bekleyen havale", deger: "26.400 ₺", alt: "1 işlem onay bekliyor" },
  { etiket: "Ortalama sepet", deger: "26.314 ₺", alt: "KDV dahil" },
  { etiket: "İade", deger: "32.400 ₺", alt: "son 30 gün · 1 işlem" },
];

export default function OdemelerPage() {
  const [odemeler, setOdemeler] = useState(odemeDataInitial);
  const [filtre, setFiltre] = useState("Tümü");

  const onayla = (no: string) => {
    setOdemeler((prev) => prev.map((o) => (o.no === no ? { ...o, durum: "Ödendi" } : o)));
  };

  const gosterilecek = odemeler.filter((o) => filtre === "Tümü" || o.durum === filtre);

  return (
    <main className="p-7 pb-14">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Ödemeler
      </h1>
      <p className="mt-[7px] text-[14.5px] text-[#5C6273]">Kart ve havale işlemleri, fatura durumu ve iade talepleri.</p>

      <div className="mt-[22px] grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        {odemeKpi.map((k) => (
          <div key={k.etiket} className="rounded-[14px] border border-ink/10 bg-white p-[17px] px-[19px]">
            <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#8A8F9E] uppercase">{k.etiket}</div>
            <div className="mt-[11px] font-heading text-2xl font-semibold tracking-[-0.03em]">{k.deger}</div>
            <div className="mt-[5px] text-[12.5px] text-[#8A8F9E]">{k.alt}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filtreler.map((f) => {
          const secili = filtre === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className="h-10 rounded-[10px] border px-[15px] text-[13.5px] font-semibold hover:border-brand"
              style={{
                background: secili ? "#0A0D18" : "#FFFFFF",
                color: secili ? "#FFFFFF" : "#3A3F4F",
                borderColor: secili ? "#0A0D18" : "rgba(10,13,24,0.13)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="grid grid-cols-[120px_1.6fr_1.6fr_1.1fr_1fr_0.9fr_110px] gap-[14px] border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
          <span>İşlem no</span>
          <span>Öğrenci</span>
          <span>Program</span>
          <span>Yöntem</span>
          <span>Tutar</span>
          <span>Durum</span>
          <span />
        </div>
        {gosterilecek.map((o) => {
          const bekliyor = o.durum === "Onay bekliyor";
          return (
            <div
              key={o.no}
              className="grid grid-cols-[120px_1.6fr_1.6fr_1.1fr_1fr_0.9fr_110px] items-center gap-[14px] border-b border-ink/7 px-[22px] py-[14px] transition last:border-b-0 hover:bg-[#F7F9FF]"
            >
              <span className="font-mono text-[11.5px] text-[#5C6273]">{o.no}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{o.isim}</span>
                <span className="mt-[2px] block font-mono text-[10px] text-[#8A8F9E]">29 Tem 2026</span>
              </span>
              <span className="min-w-0 text-[13.5px] text-[#3A3F4F]">{o.program}</span>
              <span className="text-[13px] text-[#5C6273]">{o.yontem}</span>
              <span className="font-heading text-[15px] font-semibold">{o.tutar}</span>
              <span>
                <StatusBadge durum={o.durum} />
              </span>
              {bekliyor ? (
                <button
                  type="button"
                  onClick={() => onayla(o.no)}
                  className="h-8 rounded-[8px] border border-brand bg-white text-[12.5px] font-semibold text-brand hover:bg-ink hover:text-white hover:border-ink"
                >
                  Onayla
                </button>
              ) : (
                <button
                  type="button"
                  className="h-8 rounded-[8px] border border-ink/13 bg-white text-[12.5px] font-semibold text-ink hover:bg-ink hover:text-white hover:border-ink"
                >
                  Fatura
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
