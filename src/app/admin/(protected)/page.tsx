"use client";

import { useState } from "react";
import Link from "next/link";
import { odemeData } from "@/lib/admin/data";
import { durumStil, initials } from "@/lib/admin/shared";

const donemlerListe = ["7 gün", "30 gün", "12 ay"];

const kpiler = [
  { etiket: "Aylık gelir", deger: "184.200 ₺", alt: "7 satış", delta: "+22%", deltaRenk: "#1C56F3", barlar: ["38%", "52%", "46%", "64%", "78%", "92%"] },
  { etiket: "Aktif öğrenci", deger: "142", alt: "18'i bu ay katıldı", delta: "+18", deltaRenk: "#1C56F3", barlar: ["52%", "58%", "60%", "72%", "80%", "88%"] },
  { etiket: "Tamamlanma oranı", deger: "%68", alt: "ortalama ders bitirme", delta: "+4 puan", deltaRenk: "#3A3F4F", barlar: ["46%", "52%", "58%", "56%", "64%", "68%"] },
  { etiket: "Açık talep", deger: "2", alt: "ort. yanıt 4 saat", delta: "1 bekliyor", deltaRenk: "#A5711A", barlar: ["70%", "58%", "44%", "36%", "30%", "24%"] },
];

const gelirAylar = [
  { ay: "Şub", tutar: "96 B", px: "70px", renk: "rgba(28,86,243,0.3)" },
  { ay: "Mar", tutar: "128 B", px: "93px", renk: "rgba(28,86,243,0.3)" },
  { ay: "Nis", tutar: "112 B", px: "81px", renk: "rgba(28,86,243,0.3)" },
  { ay: "May", tutar: "156 B", px: "113px", renk: "rgba(28,86,243,0.3)" },
  { ay: "Haz", tutar: "168 B", px: "122px", renk: "rgba(28,86,243,0.3)" },
  { ay: "Tem", tutar: "184 B", px: "134px", renk: "#1C56F3" },
];

const bekleyenler = [
  { baslik: "Havale onayı bekliyor", alt: "Ahmet Bahçeci · 26.400 ₺", nokta: "#A5711A", href: "/admin/odemeler" },
  { baslik: "2 destek talebi açık", alt: "En eskisi 1 gün önce açıldı", nokta: "#1C56F3", href: "/admin/destek" },
  { baslik: "1 öğrenci panele hiç girmedi", alt: "Davet 5 gün önce gönderildi", nokta: "#A5711A", href: "/admin/ogrenciler" },
  { baslik: "Modül 5 videoları güncellenmeli", alt: "Advantage+ arayüzü değişti", nokta: "rgba(10,13,24,0.25)", href: "/admin/egitimler" },
];

const programPerf = [
  { ad: "Meta Business Eğitimi", satis: "84 satış", yuzde: "88%", meta: "tamamlanma %71 · ort. 15 saat" },
  { ad: "Sosyal Medya Eğitimi", satis: "46 satış", yuzde: "52%", meta: "tamamlanma %64 · ort. 22 saat" },
  { ad: "Yapay Zekâ Eğitimi", satis: "31 satış", yuzde: "34%", meta: "tamamlanma %78 · ort. 7 saat" },
];

export default function AdminGenelBakisPage() {
  const [donem, setDonem] = useState("30 gün");
  const sonIslemler = odemeData.slice(0, 5);

  return (
    <main className="flex flex-col gap-5 p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F9E] uppercase">Perşembe, 30 Temmuz 2026</div>
          <h1 className="mt-[9px] font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Genel bakış
          </h1>
        </div>
        <div className="flex gap-2">
          {donemlerListe.map((d) => {
            const secili = donem === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDonem(d)}
                className="h-9 rounded-[9px] border px-[14px] text-[13.5px] font-semibold hover:border-brand"
                style={{
                  background: secili ? "#0A0D18" : "#FFFFFF",
                  color: secili ? "#FFFFFF" : "#3A3F4F",
                  borderColor: secili ? "#0A0D18" : "rgba(10,13,24,0.13)",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        {kpiler.map((k) => (
          <div key={k.etiket} className="rounded-[14px] border border-ink/10 bg-white p-[19px] px-[19px] pt-[17px] pb-[15px]">
            <div className="flex items-center justify-between gap-[10px]">
              <span className="font-mono text-[9.5px] tracking-[0.13em] text-[#8A8F9E] uppercase">{k.etiket}</span>
              <span className="font-mono text-[10px]" style={{ color: k.deltaRenk }}>
                {k.delta}
              </span>
            </div>
            <div className="mt-[13px] flex items-end justify-between gap-3">
              <div>
                <div className="font-heading text-2xl leading-none font-semibold tracking-[-0.03em]">{k.deger}</div>
                <div className="mt-[6px] text-[12.5px] text-[#8A8F9E]">{k.alt}</div>
              </div>
              <div className="flex h-[34px] items-end gap-[3px]">
                {k.barlar.map((b, i) => (
                  <span key={i} className="w-[6px] rounded-[3px] bg-brand/28" style={{ height: b }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Aylık gelir</h2>
              <span className="font-mono text-[10px] tracking-[0.1em] text-[#8A8F9E] uppercase">Şub – Tem 2026</span>
            </div>
            <div className="mt-[22px] flex h-[190px] items-stretch gap-[14px]">
              {gelirAylar.map((a) => (
                <div key={a.ay} className="flex h-full flex-1 flex-col items-center justify-end gap-[9px]">
                  <span className="font-mono text-[10.5px] text-[#5C6273]">{a.tutar}</span>
                  <span className="w-full max-w-[54px] rounded-t-[8px] rounded-b-[3px]" style={{ height: a.px, background: a.renk }} />
                  <span className="font-mono text-[10.5px] text-[#8A8F9E]">{a.ay}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-[22px] py-[18px]">
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Son işlemler</h2>
              <Link href="/admin/odemeler" className="text-[13.5px] font-semibold text-brand">
                Tümü →
              </Link>
            </div>
            {sonIslemler.map((i) => {
              const st = durumStil(i.durum);
              return (
                <div key={i.no} className="flex items-center gap-[14px] border-b border-ink/7 px-[22px] py-[13px] last:border-b-0">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] font-mono text-[10.5px] font-medium text-[#5C6273]">
                    {initials(i.isim)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{i.isim}</div>
                    <div className="mt-[2px] font-mono text-[10.5px] text-[#8A8F9E]">
                      {i.no} · {i.yontem}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                    style={{ background: st.bg, color: st.renk }}
                  >
                    {i.durum}
                  </span>
                  <span className="w-[98px] text-right font-heading text-[15px] font-semibold">{i.tutar}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="overflow-hidden rounded-2xl border border-brand/28 bg-[#F5F8FF]">
            <div className="flex items-center justify-between gap-3 border-b border-brand/18 px-5 py-[18px]">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Aksiyon bekleyenler</h2>
              <span className="font-mono text-[10px] text-brand">{bekleyenler.length} iş</span>
            </div>
            {bekleyenler.map((b) => (
              <Link
                key={b.baslik}
                href={b.href}
                className="flex items-center gap-3 border-b border-brand/14 px-5 py-[14px] last:border-b-0 hover:bg-brand/7"
              >
                <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: b.nokta }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{b.baslik}</span>
                  <span className="mt-[3px] block text-[12.5px] text-[#5C6273]">{b.alt}</span>
                </span>
                <span className="flex-none text-xs text-brand">→</span>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Program performansı</h2>
            <div className="mt-[18px] flex flex-col gap-[14px]">
              {programPerf.map((p) => (
                <div key={p.ad}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-medium text-[#2B303D]">{p.ad}</span>
                    <span className="font-mono text-[10.5px] text-[#5C6273]">{p.satis}</span>
                  </div>
                  <div className="mt-[7px] h-[6px] overflow-hidden rounded-full bg-ink/8">
                    <div className="h-full rounded-full bg-brand" style={{ width: p.yuzde }} />
                  </div>
                  <div className="mt-[5px] font-mono text-[10px] text-[#9CA1AE]">{p.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
