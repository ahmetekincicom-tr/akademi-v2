"use client";

import { useState } from "react";
import Link from "next/link";

const kpiler = [
  { etiket: "Genel ilerleme", deger: "71%", alt: "17/24 ders", delta: "+8 bu hafta", deltaRenk: "#1C56F3", barlar: ["28%", "44%", "40%", "62%", "72%", "78%"] },
  { etiket: "İzleme süresi", deger: "9s 40dk", alt: "son 30 gün", delta: "+1s 20dk", deltaRenk: "#1C56F3", barlar: ["40%", "30%", "55%", "48%", "70%", "88%"] },
  { etiket: "Uygulama serisi", deger: "12 gün", alt: "aralıksız çalışma", delta: "kişisel rekor", deltaRenk: "#3A3F4F", barlar: ["55%", "62%", "58%", "74%", "80%", "95%"] },
  { etiket: "Açık sorular", deger: "1", alt: "ortalama yanıt 4 saat", delta: "2 yanıtlandı", deltaRenk: "#3A3F4F", barlar: ["70%", "50%", "62%", "40%", "34%", "22%"] },
];

const gorevData: [string, string, string][] = [
  ["g1", "Modül 5 · Teklif stratejileri dersini bitir", "Bugün"],
  ["g2", "Bütçe dağıtım kontrol listesini kendi hesabına uygula", "Yarın"],
  ["g3", "Birebir seans için 2 kampanya sorusu hazırla", "11 Ağustos"],
  ["g4", "Modül 6 raporlama şablonunu indir", "Bu hafta"],
];

const modulIlerleme = [
  { ad: "Modül 1 · Meta ekosistemi", yuzde: "100%" },
  { ad: "Modül 2 · Ölçümleme altyapısı", yuzde: "100%" },
  { ad: "Modül 3 · Hedef kitle stratejisi", yuzde: "100%" },
  { ad: "Modül 4 · Kreatif ve mesaj testleri", yuzde: "100%" },
  { ad: "Modül 5 · Kampanya optimizasyonu", yuzde: "40%" },
  { ad: "Modül 6 · Raporlama ve ölçekleme", yuzde: "0%" },
];

const aktivite = [3, 0, 2, 4, 1, 0, 0, 2, 3, 0, 1, 4, 2, 0, 0, 1, 3, 3, 2, 0, 1, 4, 2, 2, 0, 3, 1, 0, 1, 3, 4, 2, 0, 0, 2];
const aktiviteRenk = ["#EDEFF5", "rgba(28,86,243,0.24)", "rgba(28,86,243,0.45)", "rgba(28,86,243,0.7)", "#1C56F3"];

const egitimler = [
  { baslik: "Birebir Meta Business Eğitimi", meta: "6 modül · 24 ders · 15 saat", yuzde: "72%", durum: "Devam ediyor", aksiyon: "Devam et" },
  { baslik: "Birebir Sosyal Medya Eğitimi", meta: "8 modül · 31 ders · 22 saat", yuzde: "38%", durum: "Devam ediyor", aksiyon: "Devam et" },
  { baslik: "Pazarlamada Yapay Zekâ Eğitimi", meta: "4 modül · 12 ders · 7 saat", yuzde: "100%", durum: "Tamamlandı", aksiyon: "Tekrar izle" },
];

const dokumanlar = [
  { tip: "PDF", ad: "Kampanya bütçe planlama şablonu", meta: "Meta Business · 2 gün önce · 480 KB" },
  { tip: "XLSX", ad: "Aylık reklam raporu şablonu", meta: "Meta Business · 5 gün önce · 96 KB" },
  { tip: "PDF", ad: "Kreatif test kontrol listesi", meta: "Sosyal Medya · 1 hafta önce · 220 KB" },
  { tip: "DOCX", ad: "İçerik takvimi taslağı", meta: "Sosyal Medya · 2 hafta önce · 68 KB" },
];

const duyurular = [
  { tarih: "28 Temmuz", aktif: true, baslik: "Modül 5 içerikleri güncellendi", metin: "Advantage+ kampanya arayüzü değiştiği için iki ders yeniden çekildi." },
  { tarih: "21 Temmuz", aktif: false, baslik: "Ağustos seans takvimi açıldı", metin: "Birebir seans saatlerini takvimden ayırabilirsin." },
  { tarih: "12 Temmuz", aktif: false, baslik: "Yeni şablon: rapor otomasyonu", metin: "Doküman kütüphanesine Looker Studio şablonu eklendi." },
];

export default function PanelOverviewPage() {
  const [gorevler, setGorevler] = useState<string[]>(["g4"]);

  const toggleGorev = (id: string) => {
    setGorevler((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat(id)));
  };

  return (
    <main className="flex flex-col gap-[26px] p-[34px] pb-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-mono text-[10.5px] tracking-[0.14em] text-[#8A8F9E] uppercase">Salı, 29 Temmuz</div>
          <h1 className="mt-[10px] font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
            Tekrar hoş geldin, Selin
          </h1>
          <p className="mt-2 text-[15px] text-[#5C6273]">
            Bu hafta 2 dersin ve 1 birebir seansın var. Modül 5&apos;i bitirmene 3 ders kaldı.
          </p>
        </div>
        <div className="flex gap-[10px]">
          <button
            type="button"
            className="h-[42px] rounded-[10px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Haftalık rapor
          </button>
          <Link
            href="/panel/dersler"
            className="flex h-[42px] items-center rounded-[10px] bg-ink px-[18px] text-sm font-semibold text-white hover:bg-brand"
          >
            Çalışmaya başla
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiler.map((k) => (
          <div
            key={k.etiket}
            className="rounded-[14px] border border-ink/10 bg-white p-5 px-5 pt-[18px] pb-4 transition hover:shadow-[0_14px_32px_rgba(10,13,24,0.08)]"
          >
            <div className="flex items-center justify-between gap-[10px]">
              <span className="font-mono text-[9.5px] tracking-[0.13em] text-[#8A8F9E] uppercase">{k.etiket}</span>
              <span className="font-mono text-[10px]" style={{ color: k.deltaRenk }}>
                {k.delta}
              </span>
            </div>
            <div className="mt-[14px] flex items-end justify-between gap-[14px]">
              <div>
                <div className="font-heading text-[28px] leading-none font-semibold tracking-[-0.03em]">{k.deger}</div>
                <div className="mt-[6px] text-[12.5px] text-[#8A8F9E]">{k.alt}</div>
              </div>
              <div className="flex h-[38px] items-end gap-[3px]">
                {k.barlar.map((b, i) => (
                  <span key={i} className="w-[6px] rounded-[3px] bg-brand/28" style={{ height: b }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex items-center gap-7 overflow-hidden rounded-2xl bg-ink px-[30px] py-7 text-white">
        <div className="absolute top-[-140px] right-[6%] h-[380px] w-[380px] rounded-full bg-brand opacity-24 blur-[110px]" />
        <div className="placeholder-block-dark relative flex aspect-[16/10] w-[150px] flex-none items-center justify-center rounded-[11px]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-[13px]">▶</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="font-mono text-[10px] tracking-[0.14em] text-white/50 uppercase">Kaldığın yerden devam et</div>
          <div className="mt-[10px] font-heading text-[22px] font-semibold tracking-[-0.025em] sm:text-[23px]">
            Modül 5 · Teklif stratejileri ve bütçe dağıtımı
          </div>
          <div className="mt-2 text-sm text-white/60">Birebir Meta Business Eğitimi · 35 dk · 12 dakika izlendi</div>
          <div className="mt-4 h-[6px] max-w-[520px] overflow-hidden rounded-full bg-white/14">
            <div className="h-full rounded-full bg-brand" style={{ width: "34%" }} />
          </div>
        </div>
        <Link
          href="/panel/dersler"
          className="relative flex h-13 flex-none items-center rounded-[11px] bg-brand px-[26px] text-base font-semibold text-white shadow-[0_12px_30px_rgba(28,86,243,0.36)] hover:bg-white hover:text-ink"
        >
          Derse dön →
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-[22px] xl:grid-cols-[1.55fr_1fr]">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-5">
              <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">Bu hafta planın</h2>
              <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#8A8F9E] uppercase">
                {gorevler.length}/4 tamamlandı
              </span>
            </div>
            {gorevData.map(([id, ad, tarih]) => {
              const bitti = gorevler.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleGorev(id)}
                  className="flex w-full items-center gap-[14px] border-b border-ink/7 px-6 py-[15px] text-left transition last:border-b-0 hover:bg-[#F7F9FF]"
                >
                  <span
                    className="flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border text-[10px] font-bold text-white"
                    style={{ background: bitti ? "#1C56F3" : "#FFFFFF", borderColor: bitti ? "#1C56F3" : "rgba(10,13,24,0.2)" }}
                  >
                    {bitti ? "✓" : ""}
                  </span>
                  <span
                    className="min-w-0 flex-1 text-[15px] leading-[1.45]"
                    style={{ color: bitti ? "#9CA1AE" : "#2B303D", textDecoration: bitti ? "line-through" : "none" }}
                  >
                    {ad}
                  </span>
                  <span className="flex-none font-mono text-[10.5px] text-[#9CA1AE]">{tarih}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-[1.25fr_1fr]">
            <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
              <div className="flex items-center justify-between gap-[14px]">
                <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">Modül ilerlemesi</h2>
                <span className="font-mono text-[10px] tracking-[0.1em] text-[#8A8F9E] uppercase">Meta Business</span>
              </div>
              <div className="mt-[18px] flex flex-col gap-[13px]">
                {modulIlerleme.map((m) => (
                  <div key={m.ad}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] font-medium text-[#2B303D]">{m.ad}</span>
                      <span className="font-mono text-[10.5px] text-[#8A8F9E]">{m.yuzde}</span>
                    </div>
                    <div className="mt-[7px] h-[5px] overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-brand" style={{ width: m.yuzde }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
              <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">Çalışma aktivitesi</h2>
              <p className="mt-[7px] text-[13px] text-[#8A8F9E]">Son 5 hafta · günlük izleme yoğunluğu</p>
              <div className="mt-[18px] grid grid-cols-7 gap-[6px]">
                {aktivite.map((v, i) => (
                  <span key={i} className="aspect-square rounded-[5px]" style={{ background: aktiviteRenk[v] }} />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-[#9CA1AE]">
                <span>az</span>
                {aktiviteRenk.map((c) => (
                  <span key={c} className="h-[11px] w-[11px] rounded-[4px]" style={{ background: c }} />
                ))}
                <span>çok</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-5">
              <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">Kayıtlı eğitimlerim</h2>
              <span className="font-mono text-[10.5px] tracking-[0.1em] text-[#8A8F9E] uppercase">2 aktif · 1 tamamlandı</span>
            </div>
            {egitimler.map((e) => (
              <div key={e.baslik} className="flex items-center gap-[18px] border-b border-ink/7 px-6 py-5 last:border-b-0 hover:bg-[#F7F9FF]">
                <div className="placeholder-block aspect-[16/10] w-[104px] flex-none rounded-[10px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[10px]">
                    <span className="text-[16.5px] font-semibold tracking-[-0.015em]">{e.baslik}</span>
                    <span
                      className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.1em] uppercase"
                      style={{
                        background: e.durum === "Tamamlandı" ? "rgba(10,13,24,0.07)" : "rgba(28,86,243,0.12)",
                        color: e.durum === "Tamamlandı" ? "#5C6273" : "#1C56F3",
                      }}
                    >
                      {e.durum}
                    </span>
                  </div>
                  <div className="mt-[6px] font-mono text-[11px] text-[#8A8F9E]">{e.meta}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-brand" style={{ width: e.yuzde }} />
                    </div>
                    <span className="w-[38px] text-right font-mono text-[11px] text-[#5C6273]">{e.yuzde}</span>
                  </div>
                </div>
                <Link
                  href="/panel/dersler"
                  className="flex h-10 flex-none items-center rounded-[9px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:bg-brand hover:text-white"
                >
                  {e.aksiyon}
                </Link>
              </div>
            ))}
            <div className="px-6 py-4">
              <Link href="/panel/yeni-egitimler" className="text-sm font-semibold">
                Yeni eğitim satın al →
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-6 py-5">
              <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">Son eklenen dokümanlar</h2>
              <Link href="/panel/dokumanlar" className="text-[13.5px] font-semibold">
                Kütüphane →
              </Link>
            </div>
            {dokumanlar.map((d) => (
              <div key={d.ad} className="flex items-center gap-[14px] border-b border-ink/7 px-6 py-[15px] last:border-b-0 hover:bg-[#F7F9FF]">
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
        </div>

        <div className="flex min-w-0 flex-col gap-[22px]">
          <div className="rounded-2xl border border-brand/30 bg-[#F5F8FF] p-6 px-6 pt-[22px] pb-6">
            <div className="font-mono text-[10px] tracking-[0.14em] text-brand uppercase">Yaklaşan birebir seans</div>
            <div className="mt-3 font-heading text-[22px] font-semibold tracking-[-0.025em]">12 Ağustos · 14:00</div>
            <div className="mt-[6px] text-[14.5px] text-[#3A3F4F]">Kampanya optimizasyon seansı · 60 dk · Google Meet</div>
            <div className="mt-[18px] flex gap-[10px]">
              <Link href="#" className="flex h-[42px] flex-1 items-center justify-center rounded-[9px] bg-brand text-sm font-semibold text-white hover:bg-ink">
                Seansa katıl
              </Link>
              <Link
                href="/panel/seanslar"
                className="flex h-[42px] items-center justify-center rounded-[9px] border border-brand/40 bg-white px-[14px] text-sm font-semibold text-brand hover:border-ink hover:text-ink"
              >
                Takvim
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="border-b border-ink/8 px-[22px] py-5">
              <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">Duyurular</h2>
            </div>
            {duyurular.map((d) => (
              <div key={d.baslik} className="border-b border-ink/7 px-[22px] py-[17px] last:border-b-0">
                <div className="flex items-center gap-[9px] font-mono text-[10px] tracking-[0.1em] text-[#8A8F9E] uppercase">
                  <span className="h-[6px] w-[6px] rounded-full" style={{ background: d.aktif ? "#1C56F3" : "rgba(10,13,24,0.2)" }} />
                  {d.tarih}
                </div>
                <div className="mt-[9px] text-[15px] leading-[1.35] font-semibold">{d.baslik}</div>
                <p className="mt-[6px] text-[13.5px] leading-[1.6] text-[#5C6273]">{d.metin}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-6 px-6 pt-[22px] pb-6">
            <div className="font-mono text-[10px] tracking-[0.14em] text-[#8A8F9E] uppercase">Soru-cevap kanalı</div>
            <p className="mt-3 text-[14.5px] leading-[1.6] text-[#3A3F4F]">
              Takıldığın yeri yaz; genelde aynı gün içinde yanıtlanır.
            </p>
            <Link
              href="/panel/soru-cevap"
              className="mt-4 flex h-11 items-center justify-center rounded-[10px] border border-ink/13 text-[14.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
            >
              Soru gönder
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
