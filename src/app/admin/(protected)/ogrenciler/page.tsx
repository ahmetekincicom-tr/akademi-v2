"use client";

import { useMemo, useState } from "react";
import { ogrenciData } from "@/lib/admin/data";
import { initials, StatusBadge } from "@/lib/admin/shared";

const filtreler = ["Tümü", "Aktif", "Yeni", "Tamamlandı", "Davet bekliyor"];

export default function OgrencilerPage() {
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState("Tümü");
  const [seciliIsim, setSeciliIsim] = useState<string | null>(null);
  const [not, setNot] = useState("");

  const ogrenciler = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return ogrenciData.filter(
      (o) =>
        (filtre === "Tümü" || o.durum === filtre) &&
        (!q || o.isim.toLowerCase().includes(q) || o.eposta.toLowerCase().includes(q))
    );
  }, [arama, filtre]);

  const secili = ogrenciData.find((o) => o.isim === seciliIsim) ?? null;

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Öğrenciler
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {ogrenciData.length} kayıt · panel erişimi, program ataması ve ilerleme buradan yönetilir.
          </p>
        </div>
        <div className="flex gap-[10px]">
          <button
            type="button"
            className="h-10 rounded-[10px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            CSV indir
          </button>
          <button
            type="button"
            className="h-10 rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white hover:bg-ink"
          >
            + Öğrenci davet et
          </button>
        </div>
      </div>

      <div className="mt-[22px] flex flex-wrap items-center gap-[10px]">
        <div className="flex h-[42px] max-w-[380px] min-w-[240px] flex-1 items-center gap-[9px] rounded-[10px] border border-ink/12 bg-white px-[14px]">
          <span className="font-mono text-xs text-[#9CA1AE]">⌕</span>
          <input
            type="text"
            placeholder="İsim veya e-posta ara"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="w-full border-0 bg-transparent text-sm text-ink outline-none"
          />
        </div>
        <div className="flex gap-2">
          {filtreler.map((f) => {
            const secili = filtre === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFiltre(f)}
                className="h-[42px] rounded-[10px] border px-[15px] text-[13.5px] font-semibold hover:border-brand"
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

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1.6fr_1.2fr_1fr_0.9fr_90px] gap-4 border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
          <span>Öğrenci</span>
          <span>Program</span>
          <span>İlerleme</span>
          <span>Son giriş</span>
          <span>Durum</span>
          <span />
        </div>
        {ogrenciler.map((o) => (
          <div
            key={o.isim}
            className="grid grid-cols-[2fr_1.6fr_1.2fr_1fr_0.9fr_90px] items-center gap-4 border-b border-ink/7 px-[22px] py-[14px] transition last:border-b-0 hover:bg-[#F7F9FF]"
          >
            <div className="flex min-w-0 items-center gap-[11px]">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#F2F4FA] font-mono text-[11px] font-medium text-[#5C6273]">
                {initials(o.isim)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{o.isim}</span>
                <span className="block truncate font-mono text-[10px] text-[#8A8F9E]">{o.eposta}</span>
              </span>
            </div>
            <div className="min-w-0 text-[13.5px] text-[#3A3F4F]">{o.program}</div>
            <div>
              <div className="h-[5px] overflow-hidden rounded-full bg-ink/8">
                <div className="h-full rounded-full bg-brand" style={{ width: o.yuzde }} />
              </div>
              <div className="mt-[5px] font-mono text-[10px] text-[#8A8F9E]">{o.yuzde}</div>
            </div>
            <div className="font-mono text-[11px] text-[#5C6273]">{o.sonGiris}</div>
            <div>
              <StatusBadge durum={o.durum} />
            </div>
            <button
              type="button"
              onClick={() => setSeciliIsim(o.isim)}
              className="h-8 rounded-[8px] border border-ink/13 bg-white text-[12.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
            >
              Detay
            </button>
          </div>
        ))}
      </div>

      {secili && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-brand/30 bg-white shadow-[0_20px_44px_rgba(10,13,24,0.09)]">
          <div className="flex items-center gap-[14px] border-b border-ink/8 px-6 py-5">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2F4FA] font-mono text-[13px] font-medium text-[#5C6273]">
              {initials(secili.isim)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-[19px] font-semibold tracking-[-0.02em]">{secili.isim}</div>
              <div className="mt-[3px] font-mono text-[10.5px] text-[#8A8F9E]">{secili.eposta} · Katılımcı</div>
            </div>
            <button
              type="button"
              className="h-[38px] rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
            >
              Program ata
            </button>
            <button
              type="button"
              className="h-[38px] rounded-[9px] border border-danger/30 bg-white px-[15px] text-[13.5px] font-semibold text-danger hover:bg-danger hover:text-white"
            >
              Erişimi durdur
            </button>
            <button
              type="button"
              onClick={() => setSeciliIsim(null)}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-ink/13 bg-white text-sm text-[#5C6273] hover:border-ink hover:text-ink"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-px bg-ink/9 sm:grid-cols-3">
            {[
              { etiket: "Toplam ödeme", deger: "58.800 ₺" },
              { etiket: "Panel son giriş", deger: secili.sonGiris },
              { etiket: "Kalan seans hakkı", deger: "1 seans" },
            ].map((k) => (
              <div key={k.etiket} className="bg-white px-[22px] py-[18px]">
                <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">{k.etiket}</div>
                <div className="mt-2 text-[15px] font-semibold">{k.deger}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Kayıtlı programlar</div>
              <div className="mt-3 flex flex-col gap-[10px]">
                {secili.program.split(", ").map((p, i) => (
                  <div key={p} className="flex items-center gap-3 rounded-[11px] border border-ink/11 px-[15px] py-[13px]">
                    <span className="flex-1 truncate text-sm font-semibold">{p}</span>
                    <span className="font-mono text-[10.5px] text-[#5C6273]">{i === 0 ? secili.yuzde : "38%"}</span>
                    <button
                      type="button"
                      className="h-[30px] rounded-[8px] border border-ink/13 bg-white px-[11px] text-xs font-semibold text-[#5C6273] hover:border-danger/40 hover:text-danger"
                    >
                      Çıkar
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Yönetici notu</div>
              <textarea
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Ön görüşme notları, sektör bilgisi, hedefler..."
                className="mt-3 min-h-[104px] w-full resize-y rounded-[11px] border border-ink/13 bg-white px-[14px] py-3 text-sm leading-[1.6] text-ink outline-none focus:border-brand"
              />
              <button
                type="button"
                className="mt-[10px] h-[38px] rounded-[9px] bg-brand px-4 text-[13.5px] font-semibold text-white hover:bg-ink"
              >
                Notu kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
