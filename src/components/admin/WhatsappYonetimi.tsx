"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useBildirim } from "@/components/Bildirim";
import { whatsappAyarKaydet, whatsappBagla, whatsappSistemAnahtariylaBagla } from "@/app/kontrol-9f4x2k/(protected)/whatsapp/actions";
import { BITIS_OLAYLARI, GRAPH_SURUM } from "@/lib/whatsapp/ortak";

export type MesajSatiri = {
  id: string;
  yon: "gelen" | "giden";
  kisi: string | null;
  numara: string;
  metin: string;
  zaman: string;
  kod: string | null;
  reklam: boolean;
};

type Ayar = {
  appId: string;
  configId: string;
  bagli: boolean;
  numara: string | null;
  ad: string | null;
  uygulamaylaBirlikte: boolean;
  baglanmaZamani: string | null;
  senkronKisiler: "istendi" | "hata" | null;
  senkronGecmis: "istendi" | "hata" | null;
};

type FbYanit = { authResponse?: { code?: string } | null };
type Fb = {
  init: (o: Record<string, unknown>) => void;
  login: (cb: (r: FbYanit) => void, o: Record<string, unknown>) => void;
};
type Pencere = Window & { FB?: Fb; fbAsyncInit?: () => void };

const gun = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const tarih = (iso: string | null) => (iso ? gun.format(new Date(iso)) : "—");

const DUGME =
  "inline-flex min-h-11 items-center justify-center rounded-[9px] px-4 text-[13.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const ALAN =
  "h-11 w-full rounded-[9px] border border-ink/14 bg-white px-3 font-mono text-[13.5px] outline-none focus:border-brand";

/** Facebook JS SDK'yı bir kez yükler ve verilen uygulama kimliğiyle başlatır. */
function sdkYukle(appId: string): Promise<Fb> {
  const w = window as Pencere;
  if (w.FB) return Promise.resolve(w.FB);
  return new Promise((coz, reddet) => {
    w.fbAsyncInit = () => {
      w.FB!.init({ appId, autoLogAppEvents: true, xfbml: false, version: GRAPH_SURUM });
      coz(w.FB!);
    };
    const s = document.createElement("script");
    s.src = "https://connect.facebook.net/en_US/sdk.js";
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    s.onerror = () => reddet(new Error("Facebook SDK yüklenemedi. Reklam engelleyiciyi kapatıp tekrar dene."));
    document.body.appendChild(s);
  });
}

export function WhatsappYonetimi({
  ayar,
  sirVar,
  sistemAnahtariVar,
  webhookAdresi,
  dogrulama,
  sayilar,
  mesajlar,
}: {
  ayar: Ayar;
  sirVar: boolean;
  sistemAnahtariVar: boolean;
  webhookAdresi: string;
  dogrulama: string | null;
  sayilar: { kisi: number; mesaj: number; eslesen: number; baglanan: number };
  mesajlar: MesajSatiri[];
}) {
  const bildir = useBildirim();
  const [islemde, basla] = useTransition();
  const [appId, setAppId] = useState(ayar.appId);
  const [configId, setConfigId] = useState(ayar.configId);
  const [baglaniyor, setBaglaniyor] = useState(false);
  // Embedded Signup'ın "message" olayıyla gelen hesap bilgisi; login yanıtından önce ya da sonra gelebiliyor.
  const oturum = useRef<{ olay: string; wabaId: string; telefonNumaraId: string | null } | null>(null);

  useEffect(() => {
    const dinle = (e: MessageEvent) => {
      if (!e.origin.endsWith("facebook.com")) return;
      let veri: { type?: string; event?: string; data?: Record<string, unknown> };
      try {
        veri = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (veri?.type !== "WA_EMBEDDED_SIGNUP") return;
      const olay = String(veri.event ?? "");
      if ((BITIS_OLAYLARI as readonly string[]).includes(olay)) {
        oturum.current = {
          olay,
          wabaId: String(veri.data?.waba_id ?? ""),
          telefonNumaraId: veri.data?.phone_number_id ? String(veri.data.phone_number_id) : null,
        };
      } else if (olay === "CANCEL") {
        bildir.hata("Bağlantı yarıda bırakıldı.");
      } else if (olay === "ERROR") {
        bildir.hata(`Meta bir hata bildirdi: ${String(veri.data?.error_message ?? "bilinmiyor")}`);
      }
    };
    window.addEventListener("message", dinle);
    return () => window.removeEventListener("message", dinle);
  }, [bildir]);

  const kaydet = () =>
    basla(async () => {
      const r = await whatsappAyarKaydet({ appId, configId });
      if (r.error) bildir.hata(r.error);
      else bildir.basarili("Kaydedildi.");
    });

  const kopyala = async (deger: string) => {
    try {
      await navigator.clipboard.writeText(deger);
      bildir.basarili("Kopyalandı.");
    } catch {
      bildir.hata("Kopyalanamadı; elle seç ve kopyala.");
    }
  };

  const bagla = async () => {
    setBaglaniyor(true);
    oturum.current = null;
    try {
      const fb = await sdkYukle(ayar.appId);
      fb.login(
        (yanit) => {
          const kod = yanit.authResponse?.code;
          if (!kod) {
            setBaglaniyor(false);
            return;
          }
          // Hesap bilgisi olayı birkaç yüz ms gecikebiliyor; kodun ömrü 30 sn.
          const bekle = async () => {
            for (let i = 0; i < 20 && !oturum.current; i++) await new Promise((r) => setTimeout(r, 250));
            const o = oturum.current;
            if (!o?.wabaId) {
              setBaglaniyor(false);
              bildir.hata("Meta hesap bilgisini göndermedi. Pencereyi sonuna kadar tamamlayıp tekrar dene.");
              return;
            }
            const r = await whatsappBagla({ kod, olay: o.olay, wabaId: o.wabaId, telefonNumaraId: o.telefonNumaraId });
            setBaglaniyor(false);
            if (r.error) bildir.hata(r.error);
            else {
              bildir.basarili(`WhatsApp bağlandı${r.numara ? `: ${r.numara}` : ""}.`);
              for (const u of r.uyarilar ?? []) bildir.hata(u);
            }
          };
          void bekle();
        },
        {
          config_id: ayar.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" },
        },
      );
    } catch (e) {
      setBaglaniyor(false);
      bildir.hata(e instanceof Error ? e.message : "Bağlantı başlatılamadı.");
    }
  };

  const anahtarlaBagla = () => {
    setBaglaniyor(true);
    basla(async () => {
      const r = await whatsappSistemAnahtariylaBagla();
      setBaglaniyor(false);
      if (r.error) bildir.hata(r.error);
      else {
        bildir.basarili(`WhatsApp bağlandı${r.numara ? `: ${r.numara}` : ""}.`);
        for (const u of r.uyarilar ?? []) bildir.hata(u);
      }
    });
  };

  const hazir = Boolean(ayar.appId && ayar.configId && sirVar);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-[22px] font-semibold tracking-[-0.02em]">WhatsApp</h1>
        <p className="mt-1 max-w-[72ch] text-[13.5px] leading-[1.6] text-[#5C6273]">
          0850 numarası telefondaki WhatsApp Business uygulamasından çıkmadan Meta&apos;nın API&apos;sine bağlanıyor.
          Gelen mesajlar buraya düşüyor; sitedeki düğmenin mesaja eklediği takip kodu (Ref: …) okunup tıklama kaydıyla
          eşleşiyor ve aynı telefonla açılan hesaba kendiliğinden bağlanıyor. Böylece WhatsApp&apos;tan gelen satışlar
          reklama elle kod yapıştırmadan bağlanıyor.
        </p>
      </div>

      {/* Durum */}
      <div className="flex flex-wrap gap-2 text-[12.5px]">
        <span
          className={`rounded-full border px-3 py-1 ${ayar.bagli ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
        >
          {ayar.bagli ? `Bağlı: ${ayar.numara ?? "numara"}${ayar.ad ? ` · ${ayar.ad}` : ""}` : "Bağlı değil"}
        </span>
        {ayar.bagli && (
          <span className="rounded-full border border-ink/12 bg-ink/[0.05] px-3 py-1 text-[#5C6273]">
            {ayar.uygulamaylaBirlikte ? "Telefondaki uygulamayla birlikte" : "Yalnız API"} · {tarih(ayar.baglanmaZamani)}
          </span>
        )}
        {ayar.uygulamaylaBirlikte && (
          <span className="rounded-full border border-ink/12 bg-ink/[0.05] px-3 py-1 text-[#5C6273]">
            Kişi aktarımı: {ayar.senkronKisiler ?? "—"} · Geçmiş aktarımı: {ayar.senkronGecmis ?? "—"}
          </span>
        )}
        <span
          className={`rounded-full border px-3 py-1 ${sirVar ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
        >
          WHATSAPP_APP_SECRET: {sirVar ? "tanımlı" : "eksik"}
        </span>
      </div>

      {/* Sayılar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { e: "Kişi", v: sayilar.kisi },
          { e: "Mesaj", v: sayilar.mesaj },
          { e: "Kodu okunan tıklama", v: sayilar.eslesen },
          { e: "Hesaba bağlanan", v: sayilar.baglanan },
        ].map((k) => (
          <div key={k.e} className="rounded-[12px] border border-ink/11 bg-white p-4">
            <div className="text-[24px] font-semibold text-ink">{k.v}</div>
            <div className="text-[12.5px] text-[#5C6273]">{k.e}</div>
          </div>
        ))}
      </div>

      {/* Kurulum */}
      <section className="rounded-[12px] border border-ink/11 bg-white p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-ink">1. Meta uygulaması</h2>
        <p className="mt-1 text-[13px] text-[#5C6273]">
          Uygulama kimliği (App ID) ve WhatsApp bağlantı penceresinin yapılandırma kimliği (Configuration ID). İkisi de
          gizli değil.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink">
            App ID
            <input className={ALAN} inputMode="numeric" value={appId} onChange={(e) => setAppId(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink">
            Configuration ID
            <input className={ALAN} inputMode="numeric" value={configId} onChange={(e) => setConfigId(e.target.value)} />
          </label>
        </div>
        <button type="button" onClick={kaydet} disabled={islemde} className={`${DUGME} mt-3 border border-ink/14 bg-white text-ink hover:border-brand hover:text-brand`}>
          Kaydet
        </button>
      </section>

      <section className="rounded-[12px] border border-ink/11 bg-white p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-ink">2. Webhook (Meta&apos;ya girilecek)</h2>
        <p className="mt-1 text-[13px] text-[#5C6273]">
          Meta uygulamasında WhatsApp → Yapılandırma ekranına bu iki değeri gir ve doğrula. Adresin sonundaki eğik çizgi
          şart.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {[
            { e: "Geri arama adresi (Callback URL)", v: webhookAdresi },
            { e: "Doğrulama ifadesi (Verify token)", v: dogrulama },
          ].map((s) => (
            <div key={s.e} className="flex flex-col gap-1">
              <span className="text-[12.5px] font-medium text-ink">{s.e}</span>
              <div className="flex gap-2">
                <code className="flex min-h-11 min-w-0 flex-1 items-center overflow-x-auto rounded-[9px] border border-ink/12 bg-mist px-3 text-[12.5px] break-all">
                  {s.v ?? "WHATSAPP_APP_SECRET tanımlanınca görünür"}
                </code>
                {s.v && (
                  <button type="button" onClick={() => kopyala(s.v!)} className={`${DUGME} flex-none border border-ink/14 bg-white text-ink hover:border-brand hover:text-brand`}>
                    Kopyala
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] border border-ink/11 bg-white p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-ink">3. Numarayı bağla</h2>
        <p className="mt-1 text-[13px] text-[#5C6273]">
          Meta&apos;nın penceresi açılır; numarayı seç ve telefonundaki WhatsApp Business uygulamasında çıkan onayı ver.
          Bağlantıdan sonraki 24 saat içinde sohbet geçmişinin aktarılmasına izin ver — bu süre geçerse aktarım bir daha
          yapılamıyor.
        </p>
        <button
          type="button"
          onClick={bagla}
          disabled={!hazir || baglaniyor}
          className={`${DUGME} mt-3 bg-[#25D366] text-white hover:bg-[#1ebe5a]`}
        >
          {baglaniyor ? "Bağlanıyor…" : ayar.bagli ? "Yeniden bağla" : "WhatsApp'ı bağla"}
        </button>
        {sistemAnahtariVar && (
          <div className="mt-4 border-t border-ink/10 pt-4">
            <p className="text-[13px] text-[#5C6273]">
              Meta penceresi son adımda &quot;geçerli bir İşletme Kodu değil&quot; hatası verdiyse ama QR kodu okuttuysan:
              WhatsApp hesabı uygulamanın sahibi olan işletmeye ait olduğu için bağlantı sistem kullanıcısı anahtarıyla
              tamamlanabilir.
            </p>
            <button
              type="button"
              onClick={anahtarlaBagla}
              disabled={!ayar.appId || !sirVar || baglaniyor}
              className={`${DUGME} mt-3 border border-ink/14 bg-white text-ink hover:border-brand hover:text-brand`}
            >
              {baglaniyor ? "Bağlanıyor…" : "Sistem anahtarıyla bağlantıyı tamamla"}
            </button>
          </div>
        )}
        {!hazir && (
          <p className="mt-2 text-[12.5px] text-[#A5711A]">
            Önce App ID ve Configuration ID kaydedilmeli; WHATSAPP_APP_SECRET de tanımlı olmalı.
          </p>
        )}
      </section>

      {/* Son mesajlar */}
      <section className="rounded-[12px] border border-ink/11 bg-white">
        <h2 className="border-b border-ink/10 px-4 py-3 text-[15px] font-semibold text-ink">Son mesajlar</h2>
        {mesajlar.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[#5C6273]">Henüz mesaj yok.</p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {mesajlar.map((m) => (
              <li key={m.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex min-w-0 flex-none flex-col sm:w-[190px]">
                  <span className="truncate text-[13px] font-semibold text-ink">{m.kisi ?? `+${m.numara}`}</span>
                  <span className="text-[11.5px] text-[#8A90A0]">
                    {m.yon === "gelen" ? "Gelen" : "Giden"} · {tarih(m.zaman)}
                  </span>
                </div>
                <p className="min-w-0 flex-1 text-[13px] leading-[1.5] break-words text-[#3A3F4F]">{m.metin}</p>
                <div className="flex flex-none flex-wrap gap-1.5">
                  {m.kod && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] text-emerald-700">
                      {m.kod}
                    </span>
                  )}
                  {m.reklam && (
                    <span className="rounded-full border border-brand/25 bg-brand/[0.06] px-2 py-0.5 text-[11px] text-brand">reklam</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
