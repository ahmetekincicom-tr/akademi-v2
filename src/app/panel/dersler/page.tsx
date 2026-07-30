"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lesson = { id: string; ad: string; sure: string };
type Modul = { baslik: string; dersler: Lesson[] };

const mufredatData: Modul[] = [
  {
    baslik: "Modül 4 · Kreatif ve mesaj testleri",
    dersler: [
      { id: "4-1", ad: "Durduran kreatif: format ve ilk 3 saniye", sure: "45 dk" },
      { id: "4-2", ad: "Reklam metni kalıpları ve teklif dili", sure: "35 dk" },
      { id: "4-3", ad: "A/B test kurulumu ve okuma", sure: "40 dk" },
      { id: "4-4", ad: "UGC ve içerik üretim akışı", sure: "30 dk" },
    ],
  },
  {
    baslik: "Modül 5 · Kampanya kurulumu ve optimizasyon",
    dersler: [
      { id: "5-1", ad: "Kampanya hedefi seçimi ve yapı kurulumu", sure: "45 dk" },
      { id: "5-2", ad: "Advantage+ ve manuel kampanya karşılaştırması", sure: "40 dk" },
      { id: "5-3", ad: "Teklif stratejileri ve bütçe dağıtımı", sure: "35 dk" },
      { id: "5-4", ad: "Öğrenme aşaması ve müdahale zamanlaması", sure: "30 dk" },
      { id: "5-5", ad: "Kendi kampanyanızın canlı kurulumu", sure: "45 dk" },
    ],
  },
  {
    baslik: "Modül 6 · Raporlama ve ölçekleme",
    dersler: [
      { id: "6-1", ad: "Ads Manager rapor düzeni ve metrik seçimi", sure: "40 dk" },
      { id: "6-2", ad: "ROAS, CPA ve artımlı ölçüm okuma", sure: "40 dk" },
      { id: "6-3", ad: "Dikey ve yatay ölçekleme senaryoları", sure: "40 dk" },
      { id: "6-4", ad: "Aylık optimizasyon rutini kurma", sure: "30 dk" },
    ],
  },
];

const dersMaddeleri = [
  "En düşük maliyet ve maliyet limiti stratejilerinin farkı",
  "Bütçeyi kampanya mı, kitle seti mi seviyesinde yönetmeli",
  "Öğrenme aşamasını bozmadan bütçe artırma adımları",
  "Kendi hesabınızda bütçe dağıtımının yeniden kurulması",
];

const dersDosyalari = [
  { tip: "PDF", ad: "Bütçe dağıtım kontrol listesi", meta: "Bu ders · 320 KB" },
  { tip: "XLSX", ad: "Teklif stratejisi karşılaştırma tablosu", meta: "Bu ders · 74 KB" },
  { tip: "PDF", ad: "Ders sunumu · Modül 5", meta: "Bu ders · 1,2 MB" },
];

const initialCompleted = ["4-1", "4-2", "4-3", "4-4", "5-1", "5-2"];
const TOTAL_LESSONS = 24;
const BASE_COMPLETED_ELSEWHERE = 11; // modules 1-3, not shown in this trimmed curriculum view

const sekmeler: { id: "aciklama" | "dosya" | "not"; ad: string }[] = [
  { id: "aciklama", ad: "Ders açıklaması" },
  { id: "dosya", ad: "Ekli dosyalar (3)" },
  { id: "not", ad: "Notlarım" },
];

function dersAdi(id: string) {
  for (const m of mufredatData) {
    for (const d of m.dersler) if (d.id === id) return d.ad;
  }
  return "Ders";
}

export default function DersIzlemePage() {
  const [aktif, setAktif] = useState("5-3");
  const [tamamlananlar, setTamamlananlar] = useState<string[]>(initialCompleted);
  const [sekme, setSekme] = useState<"aciklama" | "dosya" | "not">("aciklama");
  const [notlar, setNotlar] = useState<Record<string, string>>({});

  const bitti = tamamlananlar.includes(aktif);
  const tamamlanan = BASE_COMPLETED_ELSEWHERE + tamamlananlar.length;
  const ilerlemeYuzde = Math.round((tamamlanan / TOTAL_LESSONS) * 100) + "%";

  const toggleTamamla = () => {
    setTamamlananlar((prev) => (prev.includes(aktif) ? prev.filter((x) => x !== aktif) : prev.concat(aktif)));
  };

  const notMetni = notlar[aktif] ?? "";

  const activeLessonName = useMemo(() => dersAdi(aktif), [aktif]);

  return (
    <main className="p-[34px] px-[34px] pt-[26px] pb-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/panel"
            className="flex h-[38px] flex-none items-center rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            ← Panel
          </Link>
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] tracking-[0.1em] text-[#8A8F9E] uppercase">
              Birebir Meta Business Eğitimi · Modül 5
            </div>
            <h1 className="mt-[6px] font-heading text-2xl leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[26px]">
              {activeLessonName}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTamamla}
          className="h-[46px] flex-none rounded-[10px] px-[22px] text-[15px] font-semibold hover:opacity-90"
          style={{ background: bitti ? "#E9EDF7" : "#1C56F3", color: bitti ? "#3A3F4F" : "#FFFFFF" }}
        >
          {bitti ? "✓ Tamamlandı" : "Dersi tamamlandı işaretle"}
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] xl:grid-cols-[1fr_372px]">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <div className="overflow-hidden rounded-2xl border border-ink/12 bg-ink">
            <div className="placeholder-block-dark relative flex aspect-video items-center justify-center rounded-none border-0">
              <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-brand text-xl text-white shadow-[0_14px_34px_rgba(28,86,243,0.44)]">
                ▶
              </span>
              <span className="absolute bottom-[14px] left-4 rounded-[6px] bg-ink/72 px-[9px] py-[5px] font-mono text-[10.5px] text-white/60">
                ders videosu 16:9
              </span>
            </div>
            <div className="flex items-center gap-4 px-[18px] py-[14px] text-white/70">
              <span className="text-[13px]">▶</span>
              <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/16">
                <div className="h-full rounded-full bg-brand" style={{ width: "34%" }} />
              </div>
              <span className="font-mono text-[11.5px]">12:04 / 35:00</span>
              <span className="font-mono text-[11.5px]">1.0×</span>
              <span className="text-xs">⤢</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex gap-1 border-b border-ink/8 px-[18px] pt-[14px]">
              {sekmeler.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSekme(t.id)}
                  className="border-b-2 px-[14px] pt-[10px] pb-[14px] text-[14.5px] font-semibold"
                  style={{ color: sekme === t.id ? "#1C56F3" : "#5C6273", borderColor: sekme === t.id ? "#1C56F3" : "transparent" }}
                >
                  {t.ad}
                </button>
              ))}
            </div>

            {sekme === "aciklama" && (
              <div className="px-[26px] pt-6 pb-7">
                <p className="text-[15.5px] leading-[1.7] text-[#2B303D]">
                  Bu derste teklif stratejilerini tek tek açıp, hangi senaryoda hangisinin mantıklı olduğunu kendi
                  kampanya yapınız üzerinde karşılaştırıyoruz. Ders sonunda bütçe dağıtımınızı yeniden kurgulayacak bir
                  kontrol listeniz olacak.
                </p>
                <div className="mt-[22px] flex flex-col gap-[11px]">
                  {dersMaddeleri.map((m) => (
                    <div key={m} className="flex items-start gap-[11px] text-[15px] leading-[1.55] text-[#3A3F4F]">
                      <span className="mt-[2px] flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[6px] bg-brand/12 text-[10px] font-bold text-brand">
                        ✓
                      </span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sekme === "dosya" && (
              <div className="py-2 pb-3">
                {dersDosyalari.map((d) => (
                  <div key={d.ad} className="flex items-center gap-[14px] border-b border-ink/7 px-[26px] py-[15px] last:border-b-0">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] bg-[#F2F4FA] font-mono text-[9.5px] font-medium text-brand">
                      {d.tip}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold">{d.ad}</div>
                      <div className="mt-[3px] font-mono text-[10.5px] text-[#8A8F9E]">{d.meta}</div>
                    </div>
                    <button
                      type="button"
                      className="h-[34px] flex-none rounded-[8px] border border-ink/13 bg-white px-[13px] text-[13px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
                    >
                      İndir
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sekme === "not" && (
              <div className="px-[26px] pt-[22px] pb-[26px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Bu derse ait notlarım</span>
                  <span className="font-mono text-[10.5px] text-brand">{notMetni.length ? "Kaydedilmedi" : "Boş"}</span>
                </div>
                <textarea
                  value={notMetni}
                  onChange={(e) => setNotlar((prev) => ({ ...prev, [aktif]: e.target.value }))}
                  placeholder="Ders sırasında aklına gelenleri buraya yaz. Notların yalnızca sana görünür."
                  className="mt-[14px] min-h-[170px] w-full resize-y rounded-[11px] border border-ink/13 bg-white px-4 py-[14px] text-[15px] leading-[1.6] text-ink outline-none focus:border-brand"
                />
                <div className="mt-[14px] flex items-center gap-3">
                  <button type="button" className="h-[42px] rounded-[10px] bg-brand px-5 text-[14.5px] font-semibold text-white hover:bg-ink">
                    Notu kaydet
                  </button>
                  <span className="text-[13px] text-[#8A8F9E]">Notlar panelden de indirilebilir.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white xl:sticky xl:top-24">
          <div className="border-b border-ink/8 px-[22px] py-5">
            <div className="flex items-center justify-between gap-[14px]">
              <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">Müfredat</h2>
              <span className="font-mono text-[10.5px] text-[#8A8F9E]">{tamamlanan}/24 ders</span>
            </div>
            <div className="mt-[14px] h-[6px] overflow-hidden rounded-full bg-ink/8">
              <div className="h-full rounded-full bg-brand" style={{ width: ilerlemeYuzde }} />
            </div>
          </div>
          <div className="max-h-[620px] overflow-auto">
            {mufredatData.map((m) => (
              <div key={m.baslik}>
                <div className="flex items-center justify-between gap-3 border-b border-ink/7 bg-mist px-[22px] py-[14px] pb-[10px]">
                  <span className="font-mono text-[10.5px] tracking-[0.08em] text-[#5C6273] uppercase">{m.baslik}</span>
                  <span className="font-mono text-[10px] text-[#9CA1AE]">{m.dersler.length} ders</span>
                </div>
                {m.dersler.map((d) => {
                  const bitmis = tamamlananlar.includes(d.id);
                  const secili = aktif === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setAktif(d.id)}
                      className="flex w-full items-center gap-3 border-b border-ink/6 px-[22px] py-[13px] text-left hover:bg-[#F5F8FF]"
                      style={{ background: secili ? "#EEF3FF" : "#FFFFFF" }}
                    >
                      <span
                        className="flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border text-[10px] font-bold"
                        style={{
                          background: bitmis ? "#1C56F3" : "#FFFFFF",
                          color: "#FFFFFF",
                          borderColor: bitmis ? "#1C56F3" : "rgba(10,13,24,0.18)",
                        }}
                      >
                        {bitmis ? "✓" : ""}
                      </span>
                      <span
                        className="min-w-0 flex-1 text-sm leading-[1.4]"
                        style={{ color: secili ? "#0A0D18" : bitmis ? "#5C6273" : "#2B303D", fontWeight: secili ? 600 : 500 }}
                      >
                        {d.ad}
                      </span>
                      <span className="flex-none font-mono text-[10.5px] text-[#9CA1AE]">{d.sure}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
