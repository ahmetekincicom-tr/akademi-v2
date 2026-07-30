"use client";

import { useMemo, useState } from "react";
import { talepData } from "@/lib/admin/data";
import { StatusBadge } from "@/lib/admin/shared";

const talepFiltreler = ["Açık", "İnceleniyor", "Yanıtlandı", "Tamamlandı", "Tümü"];
const durumSecenekleri = ["Açık", "İnceleniyor", "Yanıtlandı", "Tamamlandı"];
const oncelikSecenekleri = ["Düşük", "Normal", "Acil"];
const oncelikRenk: Record<string, string> = { Düşük: "#5C6273", Normal: "#1C56F3", Acil: "#C13333" };
const hazirYanit = ["Ekran paylaşımlı seans önerisi", "İlgili dersin linki", "Fatura güncelleme akışı"];

export default function DestekPage() {
  const [talepFiltre, setTalepFiltre] = useState("Açık");
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [durumlar, setDurumlar] = useState<Record<string, string>>({});
  const [oncelikler, setOncelikler] = useState<Record<string, string>>({});
  const [icNotAcik, setIcNotAcik] = useState(false);
  const [mesaj, setMesaj] = useState("");

  const durumOf = (id: string, varsayilan: string) => durumlar[id] ?? varsayilan;

  const filtreli = useMemo(
    () => talepData.filter((t) => talepFiltre === "Tümü" || durumOf(t.id, t.durum) === talepFiltre || t.id === seciliId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [talepFiltre, durumlar, seciliId]
  );

  const aktif = filtreli.find((t) => t.id === seciliId) ?? filtreli[0] ?? null;
  const aktifDurum = aktif ? durumOf(aktif.id, aktif.durum) : "";
  const aktifOncelik = aktif ? (oncelikler[aktif.id] ?? "Normal") : "Normal";

  const talepKapat = () => {
    if (!aktif) return;
    setDurumlar((prev) => ({ ...prev, [aktif.id]: "Tamamlandı" }));
  };

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Destek talepleri
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">Ortalama ilk yanıt süresi 4 saat · 1 açık talep</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {talepFiltreler.map((f) => {
            const secili = talepFiltre === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setTalepFiltre(f);
                  setSeciliId(null);
                }}
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
      </div>

      <div className="mt-[22px] grid grid-cols-1 items-start gap-5 lg:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-5 py-[15px] font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">
            {filtreli.length} talep
          </div>
          {filtreli.map((t) => {
            const d = durumOf(t.id, t.durum);
            const secili = aktif?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSeciliId(t.id)}
                className="w-full border-b border-ink/7 px-5 py-[15px] text-left last:border-b-0 hover:bg-[#F5F8FF]"
                style={{ background: secili ? "#EEF3FF" : "#FFFFFF" }}
              >
                <div className="flex items-center justify-between gap-[10px]">
                  <StatusBadge durum={d} />
                  <span className="font-mono text-[10px] text-[#9CA1AE]">{t.tarih}</span>
                </div>
                <div className="mt-[9px] text-[14.5px] leading-[1.4] font-semibold text-ink">{t.baslik}</div>
                <div className="mt-[5px] font-mono text-[10.5px] text-[#8A8F9E]">
                  {t.kim} · {t.program}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {aktif ? (
            <>
              <div className="border-b border-ink/8 px-6 py-[18px]">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[10px]">
                      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">{aktif.baslik}</h2>
                      <StatusBadge durum={aktifDurum} />
                    </div>
                    <div className="mt-[5px] font-mono text-[10.5px] text-[#8A8F9E]">
                      {aktif.kim} · {aktif.program} · {aktif.tarih}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="h-9 rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13px] font-semibold text-ink hover:border-brand hover:text-brand"
                  >
                    Seansa çevir
                  </button>
                  <button
                    type="button"
                    onClick={talepKapat}
                    className="h-9 rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13px] font-semibold text-ink hover:bg-ink hover:text-white"
                  >
                    Talebi kapat
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-[9px]">
                    <span className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Durum</span>
                    <div className="flex gap-[6px]">
                      {durumSecenekleri.map((d) => {
                        const secili = aktifDurum === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDurumlar((prev) => ({ ...prev, [aktif.id]: d }))}
                            className="h-8 rounded-[8px] border px-3 text-[12.5px] font-semibold hover:border-brand"
                            style={{
                              background: secili ? "#0A0D18" : "#FFFFFF",
                              color: secili ? "#FFFFFF" : "#5C6273",
                              borderColor: secili ? "#0A0D18" : "rgba(10,13,24,0.13)",
                            }}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <span className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Öncelik</span>
                    <div className="flex gap-[6px]">
                      {oncelikSecenekleri.map((o) => {
                        const secili = aktifOncelik === o;
                        return (
                          <button
                            key={o}
                            type="button"
                            onClick={() => setOncelikler((prev) => ({ ...prev, [aktif.id]: o }))}
                            className="h-8 rounded-[8px] border px-3 text-[12.5px] font-semibold hover:border-brand"
                            style={{
                              background: secili ? oncelikRenk[o] : "#FFFFFF",
                              color: secili ? "#FFFFFF" : "#5C6273",
                              borderColor: secili ? oncelikRenk[o] : "rgba(10,13,24,0.13)",
                            }}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-[14px] bg-mist p-[22px]">
                {aktif.mesajlar.map((m, i) => (
                  <div key={i} className="flex" style={{ justifyContent: m.kim === "admin" ? "flex-end" : "flex-start" }}>
                    <div
                      className="max-w-[76%] rounded-[14px] border px-4 py-[14px]"
                      style={{
                        background: m.kim === "admin" ? "#1C56F3" : "#FFFFFF",
                        color: m.kim === "admin" ? "#FFFFFF" : "#2B303D",
                        borderColor: m.kim === "admin" ? "#1C56F3" : "rgba(10,13,24,0.11)",
                      }}
                    >
                      <div
                        className="font-mono text-[10px] tracking-[0.08em]"
                        style={{ color: m.kim === "admin" ? "rgba(255,255,255,0.65)" : "#8A8F9E" }}
                      >
                        {m.kim === "admin" ? "Ahmet Ekinci" : aktif.kim} · {m.saat}
                      </div>
                      <p className="mt-2 text-[14.5px] leading-[1.6]">{m.metin}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-ink/8 px-6 py-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {hazirYanit.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className="h-8 rounded-[8px] border border-ink/12 bg-white px-3 text-[12.5px] font-medium text-[#5C6273] hover:border-brand hover:text-brand"
                    >
                      {h}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIcNotAcik((v) => !v)}
                    className="h-8 rounded-[8px] border px-3 text-[12.5px] font-semibold hover:border-[#A5711A]"
                    style={{
                      background: icNotAcik ? "rgba(201,138,27,0.14)" : "#FFFFFF",
                      color: icNotAcik ? "#A5711A" : "#5C6273",
                      borderColor: icNotAcik ? "rgba(201,138,27,0.4)" : "rgba(10,13,24,0.12)",
                    }}
                  >
                    {icNotAcik ? "İç not modu açık — öğrenci görmez" : "İç not ekle"}
                  </button>
                </div>
                <div className="flex items-end gap-3">
                  <textarea
                    value={mesaj}
                    onChange={(e) => setMesaj(e.target.value)}
                    placeholder="Yanıtını yaz..."
                    className="min-h-[62px] flex-1 resize-y rounded-[11px] border border-ink/13 bg-white px-[14px] py-3 text-[14.5px] leading-[1.55] text-ink outline-none focus:border-brand"
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
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#8A8F9E]">Bu filtrede talep yok.</div>
          )}
        </div>
      </div>
    </main>
  );
}
