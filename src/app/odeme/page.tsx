"use client";

import { useState } from "react";
import Link from "next/link";

const ANA = 18000;
const EK = 9500;

function para(n: number) {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";
}

const adimData: [number, string][] = [
  [1, "Sepet"],
  [2, "Fatura bilgileri"],
  [3, "Ödeme"],
  [4, "Onay"],
];

const taksitData: [number, string][] = [
  [1, "Tek çekim"],
  [3, "3 taksit"],
  [6, "6 taksit"],
  [9, "9 taksit"],
];

const alanlarBireysel = [
  { etiket: "Ad soyad", ipucu: "Selin Kaya", span: 1 },
  { etiket: "T.C. kimlik no", ipucu: "11 haneli", span: 1 },
  { etiket: "E-posta", ipucu: "ornek@sirket.com", span: 1 },
  { etiket: "Telefon", ipucu: "+90 5xx xxx xx xx", span: 1 },
  { etiket: "Adres", ipucu: "Mahalle, sokak, no", span: 2 },
  { etiket: "İl / ilçe", ipucu: "İstanbul / Kadıköy", span: 1 },
  { etiket: "Posta kodu", ipucu: "34000", span: 1 },
];

const alanlarKurumsal = [
  { etiket: "Şirket unvanı", ipucu: "Limonian Kozmetik A.Ş.", span: 2 },
  { etiket: "Vergi kimlik no (VKN)", ipucu: "10 haneli", span: 1 },
  { etiket: "Vergi dairesi", ipucu: "Kadıköy", span: 1 },
  { etiket: "Yetkili adı", ipucu: "Selin Kaya", span: 1 },
  { etiket: "E-posta", ipucu: "muhasebe@sirket.com", span: 1 },
  { etiket: "Adres", ipucu: "Mahalle, sokak, no", span: 2 },
  { etiket: "İl / ilçe", ipucu: "İstanbul / Kadıköy", span: 1 },
  { etiket: "e-Fatura mükellefi", ipucu: "Evet / Hayır", span: 1 },
];

const havaleSatir = [
  { etiket: "Alıcı", deger: "Ahmet Ekinci Akademi" },
  { etiket: "Banka", deger: "Örnek Bank · Ankara" },
  { etiket: "IBAN", deger: "TR00 0000 0000 0000 0000 0000 00" },
  { etiket: "Referans", deger: "AEA-2026-0731" },
];

const guvence = [
  "Ödeme sonrası panel erişimi anında açılır",
  "Ön görüşmede kapsam değişirse fark iade edilir",
  "Faturalar panelde arşivlenir",
];

export default function OdemeAkisiPage() {
  const [adim, setAdim] = useState(1);
  const [ek, setEk] = useState(false);
  const [faturaTipi, setFaturaTipi] = useState<"bireysel" | "kurumsal">("bireysel");
  const [odemeTipi, setOdemeTipi] = useState<"kart" | "havale">("kart");
  const [taksit, setTaksit] = useState(3);

  const ara = ANA + (ek ? EK : 0);
  const kdv = Math.round(ara * 0.2);
  const toplam = ara + kdv;
  const faturaAlanlar = faturaTipi === "bireysel" ? alanlarBireysel : alanlarKurumsal;
  const taksitNotu = odemeTipi === "kart" && taksit > 1 ? `${taksit} x ${para(Math.round(toplam / taksit))}` : "Tek çekim";

  const geriEtiket = adim === 1 ? "Programlara dön" : adim === 2 ? "Sepete dön" : "Fatura bilgileri";
  const ileriEtiket = adim === 1 ? "Fatura bilgilerine geç" : adim === 2 ? "Ödemeye geç" : "Ödemeyi tamamla";

  if (adim === 4) {
    return (
      <div className="min-h-screen bg-paper">
        <CheckoutHeader adim={adim} setAdim={setAdim} />
        <main className="mx-auto max-w-[1200px] px-8 py-9 pb-18">
          <div className="mx-auto max-w-[760px]">
            <div className="overflow-hidden rounded-[18px] border border-ink/10 bg-white shadow-[0_24px_56px_rgba(10,13,24,0.09)]">
              <div className="relative overflow-hidden bg-ink px-10 py-[38px] text-white">
                <div className="absolute top-[-140px] right-[8%] h-[400px] w-[400px] rounded-full bg-brand opacity-24 blur-[110px]" />
                <span className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-brand text-xl shadow-[0_12px_28px_rgba(28,86,243,0.36)]">
                  ✓
                </span>
                <h1 className="relative mt-6 font-heading text-[30px] leading-[1.1] font-semibold tracking-[-0.035em] sm:text-[34px]">
                  Kaydın tamamlandı
                </h1>
                <p className="relative mt-3 max-w-[520px] text-base leading-[1.65] text-white/68">
                  Program panelinize eklendi. Ahmet en geç 1 iş günü içinde ön görüşme için sizinle iletişime geçecek
                  ve takviminizi birlikte kuracak.
                </p>
              </div>
              <div className="px-10 pt-[30px] pb-[34px]">
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[13px] border border-ink/10 bg-ink/10">
                  {[
                    { etiket: "Program", deger: ek ? "2 program" : "Yapay Zekâ Eğitimi" },
                    { etiket: "Ödenen tutar", deger: para(toplam) },
                    { etiket: "Ödeme yöntemi", deger: odemeTipi === "kart" ? (taksit > 1 ? `Kart · ${taksit} taksit` : "Kart · tek çekim") : "Havale / EFT" },
                  ].map((b) => (
                    <div key={b.etiket} className="bg-white px-5 py-[18px]">
                      <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">{b.etiket}</div>
                      <div className="mt-2 text-[15.5px] font-semibold">{b.deger}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-[26px] flex flex-col gap-3">
                  {[
                    "Onay e-postası ve faturan e-posta adresine gönderildi.",
                    "Ahmet 1 iş günü içinde ön görüşme için sana ulaşacak.",
                    "Ön görüşmeden sonra müfredat ve ders takvimin panelde görünür olacak.",
                  ].map((s, i) => (
                    <div key={s} className="flex items-start gap-3 text-[15px] leading-[1.55] text-[#3A3F4F]">
                      <span className="mt-[2px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] bg-brand/12 font-mono text-[10px] font-medium text-brand">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-[30px] flex flex-wrap gap-3">
                  <Link
                    href="/panel"
                    className="inline-flex h-[50px] items-center gap-[9px] rounded-[11px] bg-brand px-6 text-[15.5px] font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink"
                  >
                    Panele git →
                  </Link>
                  <button
                    type="button"
                    className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-5 text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
                  >
                    Faturayı indir
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdim(1)}
                    className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-5 text-[15px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
                  >
                    Akışı baştan izle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <CheckoutHeader adim={adim} setAdim={setAdim} />

      <main className="mx-auto max-w-[1200px] px-8 py-9 pb-18">
        <div className="grid grid-cols-1 items-start gap-[26px] lg:grid-cols-[1fr_396px]">
          <div className="flex min-w-0 flex-col gap-[22px]">
            {adim === 1 && (
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="border-b border-ink/8 px-[26px] py-[22px]">
                  <h1 className="font-heading text-2xl leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[26px]">
                    Sepetin
                  </h1>
                  <p className="mt-2 text-[14.5px] text-[#5C6273]">
                    Kapsam ön görüşmede netleşir; ödeme kaydını şimdi tamamlayabilirsin.
                  </p>
                </div>
                <div className="flex gap-5 border-b border-ink/8 px-[26px] py-6">
                  <div className="placeholder-block aspect-[4/3] w-[150px] flex-none rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#8A8F9E]">7 saat · 4 modül · birebir</div>
                    <div className="mt-[9px] font-heading text-xl leading-[1.2] font-semibold tracking-[-0.025em]">
                      Pazarlamada Yapay Zekâ Eğitimi
                    </div>
                    <p className="mt-2 text-[14.5px] leading-[1.55] text-[#5C6273]">
                      İçerik, görsel, analiz ve otomasyon akışlarında yapay zekâ kullanımı. Online veya Ankara&apos;da
                      yüz yüze.
                    </p>
                    <div className="mt-[14px] flex items-center gap-4">
                      <span className="font-mono text-[11px] text-[#8A8F9E]">1 katılımcı</span>
                      <button type="button" className="border-0 bg-transparent p-0 text-[13.5px] font-semibold text-[#5C6273] hover:text-danger">
                        Kaldır
                      </button>
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-heading text-xl font-semibold tracking-[-0.02em]">{para(ANA)}</div>
                  </div>
                </div>
                <div className="px-[26px] pt-[22px] pb-6">
                  <div className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Ek modül önerisi</div>
                  <button
                    type="button"
                    onClick={() => setEk((v) => !v)}
                    className="mt-[14px] flex w-full items-center gap-[14px] rounded-[13px] border p-[18px] text-left hover:border-brand"
                    style={{ borderColor: ek ? "rgba(28,86,243,0.45)" : "rgba(10,13,24,0.12)", background: ek ? "#F5F8FF" : "#FFFFFF" }}
                  >
                    <span
                      className="flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border text-[10px] font-bold text-white"
                      style={{ background: ek ? "#1C56F3" : "#FFFFFF", borderColor: ek ? "#1C56F3" : "rgba(10,13,24,0.2)" }}
                    >
                      {ek ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] font-semibold">İleri Seviye Ölçekleme Atölyesi</span>
                      <span className="mt-1 block text-[13.5px] text-[#5C6273]">
                        6 saat · mevcut kampanyaları bozmadan bütçe büyütme senaryoları
                      </span>
                    </span>
                    <span className="flex-none font-heading text-[17px] font-semibold">{para(EK)}</span>
                  </button>
                </div>
              </div>
            )}

            {adim === 2 && (
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="border-b border-ink/8 px-[26px] py-[22px]">
                  <h1 className="font-heading text-2xl leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[26px]">
                    Fatura bilgileri
                  </h1>
                  <p className="mt-2 text-[14.5px] text-[#5C6273]">
                    Fatura, ödeme sonrası e-posta adresine ve panelindeki &quot;Hesabım&quot; bölümüne düşer.
                  </p>
                </div>
                <div className="px-[26px] pt-6 pb-7">
                  <div className="grid grid-cols-2 gap-3">
                    {(["bireysel", "kurumsal"] as const).map((key) => {
                      const secili = faturaTipi === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFaturaTipi(key)}
                          className="rounded-[13px] border p-[18px] text-left hover:border-brand"
                          style={{ borderColor: secili ? "rgba(28,86,243,0.45)" : "rgba(10,13,24,0.12)", background: secili ? "#F5F8FF" : "#FFFFFF" }}
                        >
                          <span className="flex items-center gap-[10px]">
                            <span
                              className="h-[18px] w-[18px] flex-none rounded-full border-[5px] bg-white"
                              style={{ borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.16)" }}
                            />
                            <span className="text-[15.5px] font-semibold">{key === "bireysel" ? "Bireysel" : "Kurumsal"}</span>
                          </span>
                          <span className="mt-2 block text-[13.5px] leading-[1.5] text-[#5C6273]">
                            {key === "bireysel" ? "T.C. kimlik numarası ile şahsınıza fatura" : "Şirket unvanı ve VKN ile e-fatura"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2">
                    {faturaAlanlar.map((a) => (
                      <label key={a.etiket} className="flex flex-col gap-2" style={{ gridColumn: a.span === 2 ? "span 2 / span 2" : undefined }}>
                        <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">{a.etiket}</span>
                        <input
                          type="text"
                          placeholder={a.ipucu}
                          className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adim === 3 && (
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="border-b border-ink/8 px-[26px] py-[22px]">
                  <h1 className="font-heading text-2xl leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[26px]">
                    Ödeme yöntemi
                  </h1>
                </div>
                <div className="px-[26px] pt-[22px] pb-[26px]">
                  <div className="grid grid-cols-2 gap-3">
                    {(["kart", "havale"] as const).map((key) => {
                      const secili = odemeTipi === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setOdemeTipi(key)}
                          className="rounded-[13px] border p-[18px] text-left hover:border-brand"
                          style={{ borderColor: secili ? "rgba(28,86,243,0.45)" : "rgba(10,13,24,0.12)", background: secili ? "#F5F8FF" : "#FFFFFF" }}
                        >
                          <span className="flex items-center gap-[10px]">
                            <span
                              className="h-[18px] w-[18px] flex-none rounded-full border-[5px] bg-white"
                              style={{ borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.16)" }}
                            />
                            <span className="text-[15.5px] font-semibold">{key === "kart" ? "Kredi / banka kartı" : "Havale / EFT"}</span>
                          </span>
                          <span className="mt-2 block text-[13.5px] leading-[1.5] text-[#5C6273]">
                            {key === "kart" ? "3D Secure ile anında onay, taksit imkânı" : "Banka bilgileri ile transfer, aynı gün aktivasyon"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {odemeTipi === "kart" && (
                    <div className="mt-6">
                      <div className="grid grid-cols-1 gap-[18px]">
                        <label className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Kart üzerindeki isim</span>
                          <input
                            type="text"
                            placeholder="SELİN KAYA"
                            className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Kart numarası</span>
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] font-mono text-[15px] tracking-[0.04em] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                          />
                        </label>
                      </div>
                      <div className="mt-[18px] grid grid-cols-3 gap-[18px]">
                        <label className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Ay</span>
                          <input
                            type="text"
                            placeholder="MM"
                            className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] font-mono text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Yıl</span>
                          <input
                            type="text"
                            placeholder="YY"
                            className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] font-mono text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">CVV</span>
                          <input
                            type="text"
                            placeholder="123"
                            className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] font-mono text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                          />
                        </label>
                      </div>

                      <div className="mt-[26px]">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Taksit seçenekleri</span>
                          <span className="font-mono text-[10.5px] text-[#8A8F9E]">Tüm bankalara açık</span>
                        </div>
                        <div className="mt-[14px] grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {taksitData.map(([n, ad]) => {
                            const secili = taksit === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setTaksit(n)}
                                className="rounded-xl border p-[14px] px-[15px] text-left hover:border-brand"
                                style={{ borderColor: secili ? "#1C56F3" : "rgba(10,13,24,0.12)", background: secili ? "#1C56F3" : "#FFFFFF" }}
                              >
                                <span className="block font-mono text-[10.5px] tracking-[0.08em]" style={{ color: secili ? "rgba(255,255,255,0.7)" : "#8A8F9E" }}>
                                  {ad}
                                </span>
                                <span className="mt-2 block font-heading text-base font-semibold tracking-[-0.02em]" style={{ color: secili ? "#FFFFFF" : "#0A0D18" }}>
                                  {para(Math.round(toplam / n))}
                                </span>
                                <span className="mt-1 block text-[11.5px]" style={{ color: secili ? "rgba(255,255,255,0.7)" : "#8A8F9E" }}>
                                  {n === 1 ? "toplam tutar" : `x ${n} ay`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {odemeTipi === "havale" && (
                    <div className="mt-6 overflow-hidden rounded-[13px] border border-ink/11">
                      <div className="border-b border-ink/8 bg-mist px-5 py-4 font-mono text-[10.5px] tracking-[0.12em] text-[#5C6273] uppercase">
                        Havale / EFT bilgileri
                      </div>
                      {havaleSatir.map((h) => (
                        <div key={h.etiket} className="flex items-center justify-between gap-4 border-b border-ink/7 px-5 py-[14px] last:border-b-0">
                          <span className="text-sm text-[#8A8F9E]">{h.etiket}</span>
                          <span className="text-right font-mono text-sm font-medium">{h.deger}</span>
                        </div>
                      ))}
                      <div className="px-5 py-4 text-[13.5px] leading-[1.6] text-[#5C6273]">
                        Açıklama alanına ad-soyad ve program adını yazman yeterli. Ödemen görüldüğünde panel erişimin
                        aynı gün açılır.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setAdim((s) => Math.max(1, s - 1))}
                className="h-[50px] rounded-[11px] border border-ink/14 bg-white px-5 text-[15px] font-semibold text-[#5C6273] hover:border-brand hover:text-brand"
              >
                ← {geriEtiket}
              </button>
              <button
                type="button"
                onClick={() => setAdim((s) => Math.min(4, s + 1))}
                className="h-13 rounded-[11px] bg-brand px-[26px] text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink"
              >
                {ileriEtiket} →
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-[26px]">
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_20px_44px_rgba(10,13,24,0.07)]">
              <div className="border-b border-ink/8 px-6 py-5">
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Sipariş özeti</h2>
              </div>
              <div className="flex flex-col gap-[13px] border-b border-ink/8 px-6 py-5">
                <div className="flex items-start justify-between gap-4 text-[14.5px]">
                  <span className="text-[#3A3F4F]">Pazarlamada Yapay Zekâ Eğitimi</span>
                  <span className="font-semibold whitespace-nowrap">{para(ANA)}</span>
                </div>
                {ek && (
                  <div className="flex items-start justify-between gap-4 text-[14.5px]">
                    <span className="text-[#3A3F4F]">İleri Seviye Ölçekleme Atölyesi</span>
                    <span className="font-semibold whitespace-nowrap">{para(EK)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-[11px] border-b border-ink/8 px-6 py-[18px]">
                <div className="flex items-center justify-between gap-4 text-sm text-[#5C6273]">
                  <span>Ara toplam</span>
                  <span>{para(ara)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-[#5C6273]">
                  <span>KDV (%20)</span>
                  <span>{para(kdv)}</span>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-[15px] font-semibold">Toplam</span>
                  <span className="font-heading text-[26px] font-semibold tracking-[-0.03em]">{para(toplam)}</span>
                </div>
                <div className="mt-2 text-right font-mono text-[11px] text-[#8A8F9E]">{taksitNotu}</div>
                <div className="mt-[18px] flex gap-[10px]">
                  <input
                    type="text"
                    placeholder="İndirim kodu"
                    className="h-11 flex-1 rounded-[10px] border border-ink/14 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                  />
                  <button type="button" className="h-11 rounded-[10px] border border-ink/14 bg-white px-[15px] text-sm font-semibold text-ink hover:bg-ink hover:text-white">
                    Uygula
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[11px] rounded-[14px] border border-ink/10 bg-white px-5 py-[18px]">
              {guvence.map((g) => (
                <div key={g} className="flex items-start gap-[10px] text-[13.5px] leading-[1.5] text-[#3A3F4F]">
                  <span className="mt-[1px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-[9px] font-bold text-brand">
                    ✓
                  </span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function CheckoutHeader({ adim, setAdim }: { adim: number; setAdim: (n: number) => void }) {
  return (
    <>
      <header className="border-b border-ink/9 bg-white">
        <div className="mx-auto flex h-[70px] max-w-[1200px] items-center justify-between gap-6 px-8">
          <Link href="/panel" className="flex items-center gap-[11px] text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold text-white">
              AE
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="font-heading text-[15px] font-semibold">Ahmet Ekinci Akademi</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#8A8F9E] uppercase">Güvenli ödeme</span>
            </span>
          </Link>
          <div className="flex items-center gap-[18px]">
            <div className="hidden items-center gap-2 font-mono text-[10.5px] tracking-[0.1em] text-[#5C6273] uppercase sm:flex">
              <span className="animate-pulse-dot h-[6px] w-[6px] rounded-full bg-brand" />
              256-bit SSL · 3D Secure
            </div>
            <Link href="/panel" className="text-sm font-semibold text-[#5C6273] hover:text-brand">
              Panele dön
            </Link>
          </div>
        </div>
      </header>
      <div className="border-b border-ink/9 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 overflow-x-auto px-8 py-5">
          {adimData.map(([n, ad], i) => {
            const active = adim === n;
            const done = adim > n;
            return (
              <div key={n} className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdim(n)}
                  className="flex flex-none items-center gap-[11px] rounded-[10px] border py-[9px] pr-[14px] pl-[10px] text-left hover:border-brand"
                  style={{ borderColor: active ? "#1C56F3" : "rgba(10,13,24,0.12)", background: active ? "#FFFFFF" : "transparent" }}
                >
                  <span
                    className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[8px] font-mono text-[11px] font-medium"
                    style={{
                      background: done ? "rgba(28,86,243,0.14)" : active ? "#1C56F3" : "#F2F4FA",
                      color: done ? "#1C56F3" : active ? "#FFFFFF" : "#9CA1AE",
                    }}
                  >
                    {n}
                  </span>
                  <span
                    className="text-sm font-semibold whitespace-nowrap"
                    style={{ color: adim >= n ? "#0A0D18" : "#9CA1AE" }}
                  >
                    {ad}
                  </span>
                </button>
                {i < 3 && <span className="h-px min-w-3 flex-1 bg-ink/12" />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
