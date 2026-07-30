"use client";

import { useState } from "react";
import { Toggle } from "@/components/admin/Toggle";
import { durumStil } from "@/lib/admin/shared";

const entegreSaglik = [
  { ad: "Meta Pixel", durum: "Bağlı", alt: "Son olay 3 dk önce" },
  { ad: "Conversions API", durum: "Bağlı", alt: "Eşleşme kalitesi 7,8/10" },
  { ad: "Google Analytics 4", durum: "Bağlı", alt: "Son olay 8 dk önce" },
  { ad: "Google Ads", durum: "Bağlı değil", alt: "Dönüşüm etiketi bekliyor" },
  { ad: "Bunny Stream", durum: "Bağlı", alt: "76 video · 1 kodlama hatası" },
];

const metaAlanlar = [
  { etiket: "Pixel ID", deger: "1029384756102938" },
  { etiket: "Dataset / CAPI ID", deger: "1029384756102938" },
  { etiket: "Conversions API erişim token'ı", deger: "EAAG•••••••••••••••••••• 4dQz", genis: true },
  { etiket: "Test event kodu", deger: "TEST12345" },
  { etiket: "Sunucu tarafı olay kaynağı", deger: "aea-backend (n8n webhook)" },
];

const googleAlanlar = [
  { etiket: "GA4 Measurement ID", deger: "G-XXXXXXXXXX" },
  { etiket: "GTM Container ID", deger: "GTM-XXXXXXX" },
  { etiket: "Google Ads dönüşüm ID", deger: "AW-XXXXXXXXX" },
  { etiket: "Dönüşüm etiketi", deger: "satin-alma-tamamlandi" },
];

const bunnyAyar = [
  { etiket: "Stream Library ID", deger: "418293" },
  { etiket: "CDN hostname", deger: "vz-a1b2c3d4.b-cdn.net" },
  { etiket: "Pull zone", deger: "aea-video" },
  { etiket: "API anahtarı", deger: "•••••••••••• 8f2c" },
  { etiket: "Kodlama profili", deger: "480p / 720p / 1080p" },
  { etiket: "Oynatıcı", deger: "Bunny Player · özel tema" },
];

const olayGunlugu = [
  { olay: "Purchase", kaynak: "Sunucu · CAPI", zaman: "3 dk önce", durum: "Eşleşti", deger: "32.400 ₺" },
  { olay: "InitiateCheckout", kaynak: "Tarayıcı · Pixel", zaman: "14 dk önce", durum: "Gönderildi", deger: "—" },
  { olay: "Lead", kaynak: "Tarayıcı + Sunucu", zaman: "1 saat önce", durum: "Eşleşti", deger: "—" },
  { olay: "Purchase", kaynak: "Sunucu · CAPI", zaman: "5 saat önce", durum: "Eksik parametre", deger: "26.400 ₺" },
  { olay: "ViewContent", kaynak: "Tarayıcı · Pixel", zaman: "6 saat önce", durum: "Gönderildi", deger: "—" },
];

type EntegreKey = "pixel" | "capi" | "ga4" | "ads" | "gtm" | "bunny" | "tokenAuth" | "drm" | "webhook";
type CapiKey = "PageView" | "ViewContent" | "Lead" | "InitiateCheckout" | "Purchase" | "CompleteRegistration";

const capiOlaylarMeta: { key: CapiKey; alt: string }[] = [
  { key: "PageView", alt: "Tüm sayfalar · tarayıcı" },
  { key: "ViewContent", alt: "Eğitim detay sayfası · tarayıcı" },
  { key: "Lead", alt: "Ön görüşme formu · tarayıcı + sunucu" },
  { key: "InitiateCheckout", alt: "Ödeme akışı adım 1 · tarayıcı" },
  { key: "Purchase", alt: "Ödeme başarılı · sunucu (deduplication açık)" },
  { key: "CompleteRegistration", alt: "Panel hesabı oluşturma · sunucu" },
];

export default function EntegrasyonlarPage() {
  const [entegre, setEntegre] = useState<Record<EntegreKey, boolean>>({
    pixel: true,
    capi: true,
    ga4: true,
    ads: false,
    gtm: true,
    bunny: true,
    tokenAuth: true,
    drm: false,
    webhook: true,
  });
  const [capiOlaylar, setCapiOlaylar] = useState<Record<CapiKey, boolean>>({
    PageView: true,
    ViewContent: true,
    Lead: true,
    InitiateCheckout: true,
    Purchase: true,
    CompleteRegistration: false,
  });

  const toggleEntegre = (key: EntegreKey) => setEntegre((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCapi = (key: CapiKey) => setCapiOlaylar((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Entegrasyonlar
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            Takip kodları, sunucu taraflı dönüşüm gönderimi ve video altyapısı tek yerden yönetilir.
          </p>
        </div>
        <button type="button" className="h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink">
          Değişiklikleri kaydet
        </button>
      </div>

      <div className="mt-[22px] grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-5">
        {entegreSaglik.map((e) => {
          const st = durumStil(e.durum);
          return (
            <div key={e.ad} className="rounded-[14px] border border-ink/10 bg-white p-4 px-[18px]">
              <div className="flex items-center justify-between gap-[10px]">
                <span className="text-[13.5px] font-semibold">{e.ad}</span>
                <span className="h-2 w-2 rounded-full" style={{ background: st.renk }} />
              </div>
              <div className="mt-[10px]">
                <span
                  className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                  style={{ background: st.bg, color: st.renk }}
                >
                  {e.durum}
                </span>
              </div>
              <div className="mt-[9px] text-xs text-[#8A8F9E]">{e.alt}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 px-6 pt-[22px] pb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Meta Pixel &amp; Conversions API</h2>
                <p className="mt-[5px] text-[13px] text-[#8A8F9E]">
                  Tarayıcı ve sunucu olayları aynı event ID ile eşleştirilir, mükerrer sayım engellenir.
                </p>
              </div>
              <span className="font-mono text-[10px] tracking-[0.1em] text-brand uppercase">Eşleşme 7,8/10</span>
            </div>
            <div className="mt-[18px] grid grid-cols-1 gap-4 sm:grid-cols-2">
              {metaAlanlar.map((a) => (
                <label key={a.etiket} className={`flex flex-col gap-2 ${a.genis ? "sm:col-span-2" : ""}`}>
                  <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">{a.etiket}</span>
                  <input
                    type="text"
                    defaultValue={a.deger}
                    className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] font-mono text-[13px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-[22px] border-t border-ink/8 pt-5">
              <div className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">Gönderilen olaylar</div>
              <div className="mt-[14px] grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {capiOlaylarMeta.map((o) => (
                  <Toggle
                    key={o.key}
                    checked={capiOlaylar[o.key]}
                    onToggle={() => toggleCapi(o.key)}
                    label={o.key}
                    sublabel={o.alt}
                    size="sm"
                  />
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-[10px]">
                <button
                  type="button"
                  className="h-10 rounded-[9px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  Test olayı gönder
                </button>
                <button
                  type="button"
                  className="h-10 rounded-[9px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  Events Manager&apos;da aç
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-6 px-6 pt-[22px] pb-6">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Google Analytics, Ads &amp; Tag Manager</h2>
            <p className="mt-[5px] text-[13px] text-[#8A8F9E]">
              GA4 ölçümü, Ads dönüşüm etiketi ve GTM konteyneri. Etiketleri GTM üzerinden yönetmek önerilir.
            </p>
            <div className="mt-[18px] grid grid-cols-1 gap-4 sm:grid-cols-2">
              {googleAlanlar.map((a) => (
                <label key={a.etiket} className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">{a.etiket}</span>
                  <input
                    type="text"
                    defaultValue={a.deger}
                    className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] font-mono text-[13px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-6 px-6 pt-[22px] pb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Bunny.net · Stream</h2>
                <p className="mt-[5px] text-[13px] text-[#8A8F9E]">Ders videoları Bunny CDN üzerinden imzalı bağlantıyla sunulur.</p>
              </div>
              <a
                href="/admin/video"
                className="h-[38px] rounded-[9px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
                style={{ display: "flex", alignItems: "center" }}
              >
                Kütüphaneyi aç
              </a>
            </div>
            <div className="mt-[18px] grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bunnyAyar.map((b) => (
                <label key={b.etiket} className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] tracking-[0.13em] text-[#8A8F9E] uppercase">{b.etiket}</span>
                  <input
                    type="text"
                    defaultValue={b.deger}
                    className="h-[46px] rounded-[10px] border border-ink/14 bg-white px-[14px] font-mono text-[13px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-[22px] flex flex-col gap-[13px] border-t border-ink/8 pt-5">
              <Toggle checked={entegre.bunny} onToggle={() => toggleEntegre("bunny")} label="Bunny Stream bağlantısı" sublabel="Ders videoları Bunny üzerinden sunulur" />
              <Toggle
                checked={entegre.tokenAuth}
                onToggle={() => toggleEntegre("tokenAuth")}
                label="Token doğrulama"
                sublabel="İmzalı URL · 6 saat geçerli, link paylaşımını engeller"
              />
              <Toggle
                checked={entegre.drm}
                onToggle={() => toggleEntegre("drm")}
                label="DRM koruması"
                sublabel="MediaCage · ek ücretli, ekran kaydını sınırlar"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-[22px] px-[22px] pt-5 pb-[22px]">
            <div className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Aktif entegrasyonlar</div>
            <div className="mt-[14px] flex flex-col gap-[13px]">
              <Toggle checked={entegre.pixel} onToggle={() => toggleEntegre("pixel")} label="Meta Pixel (tarayıcı)" sublabel="Site genelinde temel olaylar" size="sm" />
              <Toggle
                checked={entegre.capi}
                onToggle={() => toggleEntegre("capi")}
                label="Conversions API (sunucu)"
                sublabel="Event ID eşleştirmeli, mükerrer sayımı önler"
                size="sm"
              />
              <Toggle checked={entegre.ga4} onToggle={() => toggleEntegre("ga4")} label="Google Analytics 4" sublabel="Sayfa ve panel etkileşimleri" size="sm" />
              <Toggle checked={entegre.ads} onToggle={() => toggleEntegre("ads")} label="Google Ads dönüşümü" sublabel="Şu an kapalı — kampanya başlarken aç" size="sm" />
              <Toggle checked={entegre.gtm} onToggle={() => toggleEntegre("gtm")} label="Google Tag Manager" sublabel="Tüm etiketler GTM üzerinden yönetilir" size="sm" />
              <Toggle
                checked={entegre.webhook}
                onToggle={() => toggleEntegre("webhook")}
                label="Webhook / API erişimi"
                sublabel="Ödeme ve kayıt olaylarını dış sisteme iletir"
                size="sm"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-5 py-4">
              <span className="font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">Olay günlüğü</span>
              <span className="font-mono text-[10px] text-brand">canlı</span>
            </div>
            {olayGunlugu.map((o, i) => {
              const st = durumStil(o.durum === "Eksik parametre" ? "Eksik" : "Bağlı");
              return (
                <div key={i} className="border-b border-ink/7 px-5 py-[13px] last:border-b-0">
                  <div className="flex items-center justify-between gap-[10px]">
                    <span className="font-mono text-[12.5px] font-medium">{o.olay}</span>
                    <span
                      className="rounded-full px-2 py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                      style={{ background: st.bg, color: st.renk }}
                    >
                      {o.durum}
                    </span>
                  </div>
                  <div className="mt-[6px] flex items-center justify-between gap-[10px] font-mono text-[10px] text-[#8A8F9E]">
                    <span>
                      {o.kaynak} · {o.zaman}
                    </span>
                    <span>{o.deger}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
