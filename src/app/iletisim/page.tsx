"use client";

import { useState } from "react";
import Link from "next/link";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { siteNav } from "@/components/site/siteNav";

const kanallar = [
  { baslik: "WhatsApp", deger: "+90 5xx xxx xx xx", not: "En hızlı yanıt genelde buradan gelir", href: "#" },
  { baslik: "Instagram", deger: "@ahmetekinciakademi", not: "Program tanıtımları ve katılımcı içerikleri", href: "#" },
  { baslik: "E-posta", deger: "info@ahmetekinciakademi.com", not: "Kurumsal talepler ve fatura yazışmaları", href: "#" },
  { baslik: "Ofis", deger: "Çankaya, Ankara", not: "Yüz yüze görüşme ve eğitimler için", href: "#" },
];

const konular = ["Eğitim hakkında bilgi", "Ücretsiz ön görüşme", "Kurumsal eğitim", "Panel / teknik destek", "Diğer"];

export default function IletisimPage() {
  const [gonderildi, setGonderildi] = useState(false);
  const [konu, setKonu] = useState(konular[0]);

  return (
    <div className="bg-white">
      <AnnouncementBar />
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <section className="mx-auto max-w-[1240px] px-8 pt-16 pb-14">
        <SectionKicker>İletişim</SectionKicker>
        <h1 className="mt-[18px] max-w-[620px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Hangi programın size uyduğunu konuşarak bulalım.
        </h1>
        <p className="mt-6 max-w-[540px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Form doldurun ya da doğrudan WhatsApp&apos;tan yazın — genelde aynı gün içinde dönüş yapıyoruz.
        </p>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 pb-24">
        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-8">
            {gonderildi ? (
              <div className="flex flex-col items-start gap-4 py-10">
                <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand text-xl text-white shadow-[0_12px_28px_rgba(28,86,243,0.3)]">
                  ✓
                </span>
                <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em]">Mesajın iletildi</h2>
                <p className="max-w-[420px] text-[15px] leading-[1.6] text-[#5C6273]">
                  En geç 1 iş günü içinde sana dönüş yapacağız. Acil durumlarda WhatsApp&apos;tan da yazabilirsin.
                </p>
                <button
                  type="button"
                  onClick={() => setGonderildi(false)}
                  className="mt-2 h-11 rounded-[10px] border border-ink/13 bg-white px-5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  Yeni mesaj yaz
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setGonderildi(true);
                }}
              >
                <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Mesaj gönder</h2>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Ad soyad</span>
                    <input
                      required
                      type="text"
                      placeholder="Selin Kaya"
                      className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">E-posta</span>
                    <input
                      required
                      type="email"
                      placeholder="ornek@sirket.com"
                      className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Telefon</span>
                    <input
                      type="tel"
                      placeholder="+90 5xx xxx xx xx"
                      className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Konu</span>
                    <select
                      value={konu}
                      onChange={(e) => setKonu(e.target.value)}
                      className="h-[48px] rounded-[11px] border border-ink/14 bg-white px-[15px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                    >
                      {konular.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-4 flex flex-col gap-2">
                  <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Mesaj</span>
                  <textarea
                    required
                    placeholder="Kısaca işinizi ve neye ihtiyacınız olduğunu anlatın."
                    className="min-h-32 resize-y rounded-[11px] border border-ink/14 bg-white px-[15px] py-3 text-[15px] leading-[1.6] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-6 h-[52px] w-full rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink sm:w-auto sm:px-8"
                >
                  Mesajı gönder
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {kanallar.map((k) => (
              <Link
                key={k.baslik}
                href={k.href}
                className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-white p-5 hover:border-brand/45"
              >
                <span className="font-mono text-[10px] tracking-[0.14em] text-brand uppercase">{k.baslik}</span>
                <span className="text-[15.5px] font-semibold">{k.deger}</span>
                <span className="text-[13px] text-[#5C6273]">{k.not}</span>
              </Link>
            ))}
            <div className="placeholder-block flex aspect-[4/3] items-end rounded-2xl p-4">
              <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#8A8F9E]">
                harita / ofis konumu
              </span>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
