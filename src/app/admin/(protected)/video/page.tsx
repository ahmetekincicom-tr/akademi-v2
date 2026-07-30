"use client";

import { useState } from "react";
import Link from "next/link";
import { videoData } from "@/lib/admin/data";
import { StatusBadge } from "@/lib/admin/shared";

const filtreler = ["Tümü", "Hazır", "İşleniyor", "Hata"];

const videoKpi = [
  { etiket: "Toplam video", deger: "76", alt: "3 programda" },
  { etiket: "Depolama", deger: "48,2 GB", alt: "Bunny Stream · TR bölgesi" },
  { etiket: "Bu ay izlenme", deger: "3.412", alt: "ort. tamamlama %71" },
  { etiket: "Bekleyen işlem", deger: "1", alt: "1 kodlama hatası" },
];

export default function VideoKutuphanesiPage() {
  const [filtre, setFiltre] = useState("Tümü");
  const gosterilecek = videoData.filter((v) => filtre === "Tümü" || v.durum === filtre);

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Video kütüphanesi
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            Bunny Stream üzerindeki ders videoları · kodlama durumu, derse atama ve izlenme verisi.
          </p>
        </div>
        <div className="flex gap-[10px]">
          <Link
            href="/admin/entegrasyonlar"
            className="flex h-[42px] items-center rounded-[10px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Bunny ayarları
          </Link>
          <button type="button" className="h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink">
            + Video yükle
          </button>
        </div>
      </div>

      <div className="mt-[22px] grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        {videoKpi.map((k) => (
          <div key={k.etiket} className="rounded-[14px] border border-ink/10 bg-white p-[17px] px-[19px]">
            <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#8A8F9E] uppercase">{k.etiket}</div>
            <div className="mt-[11px] font-heading text-2xl font-semibold tracking-[-0.03em]">{k.deger}</div>
            <div className="mt-[5px] text-[12.5px] text-[#8A8F9E]">{k.alt}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-[14px] border border-dashed border-ink/20 bg-white px-[26px] py-6">
        <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl bg-[#F2F4FA] text-base text-brand">
          ↑
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Ders kaydını buraya sürükle</div>
          <div className="mt-1 text-[13px] text-[#8A8F9E]">MP4 / MOV · Bunny Stream&apos;e yüklenir, 480p–1080p kodlanır, ardından derse atanır</div>
        </div>
        <button
          type="button"
          className="h-10 flex-none rounded-[9px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Bilgisayardan seç
        </button>
      </div>

      <div className="mt-[18px] flex flex-wrap gap-2">
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
        <div className="grid grid-cols-[2.4fr_1.3fr_1.3fr_0.8fr_0.9fr_0.8fr_0.9fr_104px] gap-[13px] border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
          <span>Video</span>
          <span>Program</span>
          <span>Ders</span>
          <span>Süre</span>
          <span>Durum</span>
          <span>Kalite</span>
          <span>İzlenme</span>
          <span />
        </div>
        {gosterilecek.map((v) => {
          const atanmadi = v.ders === "Atanmadı";
          return (
            <div
              key={v.ad}
              className="grid grid-cols-[2.4fr_1.3fr_1.3fr_0.8fr_0.9fr_0.8fr_0.9fr_104px] items-center gap-[13px] border-b border-ink/7 px-[22px] py-[13px] transition last:border-b-0 hover:bg-[#F7F9FF]"
            >
              <div className="flex min-w-0 items-center gap-[11px]">
                <span className="placeholder-block flex h-[30px] w-[46px] flex-none items-center justify-center rounded-[6px] text-[9px] text-[#8A8F9E]">
                  ▶
                </span>
                <span className="min-w-0 truncate text-sm font-semibold">{v.ad}</span>
              </div>
              <span className="min-w-0 text-[13px] text-[#3A3F4F]">{v.program}</span>
              <span className="min-w-0 text-[13px] text-[#5C6273]">{v.ders}</span>
              <span className="font-mono text-[11.5px] text-[#5C6273]">{v.sure}</span>
              <span>
                <StatusBadge durum={v.durum} />
              </span>
              <span className="font-mono text-[11px] text-[#5C6273]">{v.kalite}</span>
              <span className="font-mono text-[11px] text-[#5C6273]">
                {v.izlenme} · {v.tamamlama}
              </span>
              <button
                type="button"
                className="h-8 rounded-[8px] border text-[12.5px] font-semibold hover:bg-ink hover:text-white hover:border-ink"
                style={{ borderColor: atanmadi ? "#1C56F3" : "rgba(10,13,24,0.13)", color: atanmadi ? "#1C56F3" : "#0A0D18" }}
              >
                {atanmadi ? "Derse ata" : "Düzenle"}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
