"use client";

import { useState } from "react";

const tabs = [
  { id: "profil", ad: "Profil" },
  { id: "odeme", ad: "Satın alma & faturalar" },
  { id: "sertifika", ad: "Sertifikalarım" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const profilAlanlar = [
  { etiket: "Ad soyad", deger: "Selin Kaya" },
  { etiket: "E-posta", deger: "selin@limonian.com" },
  { etiket: "Telefon", deger: "+90 5xx xxx xx xx" },
  { etiket: "Şirket", deger: "Limonian Kozmetik" },
  { etiket: "Fatura tipi", deger: "Kurumsal · VKN 1234567890" },
  { etiket: "Şehir", deger: "İstanbul" },
];

const odemeler = [
  { ad: "Birebir Meta Business Eğitimi", tarih: "14 Mayıs 2026", yontem: "Kredi kartı · 6 taksit", durum: "Ödendi" },
  { ad: "Birebir Sosyal Medya Eğitimi", tarih: "2 Mart 2026", yontem: "Havale / EFT", durum: "Ödendi" },
  { ad: "Pazarlamada Yapay Zekâ Eğitimi", tarih: "9 Ocak 2026", yontem: "Kredi kartı · tek çekim", durum: "Ödendi" },
];

const sertifikalar = [
  { ad: "Pazarlamada Yapay Zekâ Eğitimi", meta: "Tamamlandı · 12 Şubat 2026", hazir: true },
  { ad: "Birebir Meta Business Eğitimi", meta: "%72 tamamlandı · 7 ders kaldı", hazir: false },
  { ad: "Birebir Sosyal Medya Eğitimi", meta: "%38 tamamlandı · 19 ders kaldı", hazir: false },
];

export default function HesabimPage() {
  const [tab, setTab] = useState<TabId>("profil");
  const [alanlar, setAlanlar] = useState(profilAlanlar);

  return (
    <main className="p-[34px] pb-14">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">Hesabım</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex gap-1 border-b border-ink/8 px-5 pt-[14px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="border-b-2 px-[14px] pt-[10px] pb-[14px] text-[14.5px] font-semibold"
              style={{ color: tab === t.id ? "#1C56F3" : "#5C6273", borderColor: tab === t.id ? "#1C56F3" : "transparent" }}
            >
              {t.ad}
            </button>
          ))}
        </div>

        {tab === "profil" && (
          <div className="p-[26px]">
            <div className="flex items-center gap-4 border-b border-ink/8 pb-6">
              <span className="avatar-block h-14 w-14 flex-none rounded-full" />
              <div>
                <div className="text-[17px] font-semibold">Selin Kaya</div>
                <div className="mt-[3px] font-mono text-[11px] text-[#8A8F9E]">Katılımcı · Mart 2026&apos;dan beri</div>
              </div>
              <button
                type="button"
                className="ml-auto h-10 rounded-[9px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Fotoğraf değiştir
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-[18px] sm:grid-cols-2">
              {alanlar.map((a, i) => (
                <label key={a.etiket} className="flex flex-col gap-[7px]">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase">{a.etiket}</span>
                  <input
                    type="text"
                    value={a.deger}
                    onChange={(e) =>
                      setAlanlar((prev) => prev.map((row, idx) => (idx === i ? { ...row, deger: e.target.value } : row)))
                    }
                    className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand"
                  />
                </label>
              ))}
            </div>
            <div className="mt-[26px] flex gap-3">
              <button type="button" className="h-[46px] rounded-[10px] bg-brand px-[22px] text-[15px] font-semibold text-white hover:bg-ink">
                Değişiklikleri kaydet
              </button>
              <button
                type="button"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-5 text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Şifre değiştir
              </button>
            </div>
          </div>
        )}

        {tab === "odeme" && (
          <div className="py-2 pb-[14px]">
            {odemeler.map((o) => (
              <div key={o.ad} className="flex items-center gap-4 border-b border-ink/7 px-[26px] py-[18px] last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[15.5px] font-semibold">{o.ad}</div>
                  <div className="mt-1 font-mono text-[10.5px] text-[#8A8F9E]">
                    {o.tarih} · {o.yontem}
                  </div>
                </div>
                <span className="rounded-full bg-brand/12 px-[10px] py-1 font-mono text-[9.5px] tracking-[0.1em] text-brand uppercase">
                  {o.durum}
                </span>
                <button
                  type="button"
                  className="h-9 flex-none rounded-[9px] border border-ink/13 bg-white px-[14px] text-[13.5px] font-semibold text-ink hover:border-ink hover:bg-ink hover:text-white"
                >
                  Faturayı indir
                </button>
              </div>
            ))}
            <div className="px-[26px] py-4 text-[13.5px] text-[#8A8F9E]">
              Faturalar kurumsal bilgilerinize göre düzenlenir. Bilgi güncellemesi için profil sekmesini kullanın.
            </div>
          </div>
        )}

        {tab === "sertifika" && (
          <div className="grid grid-cols-1 gap-[18px] p-[26px] sm:grid-cols-2 lg:grid-cols-3">
            {sertifikalar.map((s) => (
              <div key={s.ad} className="overflow-hidden rounded-[14px] border border-ink/11">
                <div className="placeholder-block flex aspect-[1.55] items-center justify-center rounded-none border-0 border-b font-mono text-[10px] text-[#9CA1AE]">
                  sertifika önizleme
                </div>
                <div className="p-[18px] pb-5">
                  <div className="text-[15px] leading-[1.35] font-semibold">{s.ad}</div>
                  <div className="mt-[5px] font-mono text-[10.5px] text-[#8A8F9E]">{s.meta}</div>
                  {s.hazir ? (
                    <button type="button" className="mt-[14px] h-10 w-full rounded-[9px] bg-brand text-sm font-semibold text-white hover:bg-ink">
                      Sertifikayı indir
                    </button>
                  ) : (
                    <div className="mt-[14px] flex h-10 items-center justify-center rounded-[9px] bg-[#F2F4FA] text-[13.5px] font-semibold text-[#8A8F9E]">
                      Program tamamlanınca açılır
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
