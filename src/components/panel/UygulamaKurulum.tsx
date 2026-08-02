"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";

/** Kapatıldığında bir daha rahatsız etmemek için. */
const KAPATILDI = "aea-kurulum-kapatildi";

type KurulumOlayi = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function abone(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function oku() {
  try {
    return window.localStorage.getItem(KAPATILDI) ?? "";
  } catch {
    return "";
  }
}
function sunucudaOku() {
  return "bilinmiyor";
}

/**
 * Kurulu mu ve iOS mu — ikisi de React dışındaki bilgiler. Efekt içinde
 * setState çağırmamak için dış kaynak olarak okunuyor. Anlık değer tek bir
 * dize: her çağrıda yeni nesne dönseydi sonsuz render'a girerdi.
 */
function cihazAbone(cb: () => void) {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function cihazOku(): string {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone bayrağını burada tutuyor.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  return `${standalone ? "kurulu" : "tarayici"}|${ios ? "ios" : "diger"}`;
}
function cihazSunucudaOku(): string {
  // Sunucuda bilemeyiz; "kurulu" varsayıp hiç basmıyoruz, hidrasyondan sonra
  // gerçek değere geçiyor. Böylece kurulu cihazda bir anlık davet çakmıyor.
  return "kurulu|diger";
}

/**
 * Ana ekrana ekleme daveti. İki platform iki farklı yol izliyor:
 *
 * Android/Chrome beforeinstallprompt olayını veriyor, tek dokunuşla kuruluyor.
 * iOS Safari bu olayı hiç göndermiyor — orada kurulum yalnızca Paylaş menüsünden
 * elle yapılabiliyor, o yüzden düğme yerine adımları yazıyoruz.
 *
 * Zaten kurulu (standalone) açıldıysa hiç gösterilmiyor.
 */
export function UygulamaKurulum() {
  const kapatildi = useSyncExternalStore(abone, oku, sunucudaOku);
  const cihaz = useSyncExternalStore(cihazAbone, cihazOku, cihazSunucudaOku);
  const [kurulu, iosEtiket] = cihaz.split("|");
  const iosMu = iosEtiket === "ios";
  const [olay, setOlay] = useState<KurulumOlayi | null>(null);

  useEffect(() => {
    const yakala = (e: Event) => {
      e.preventDefault();
      setOlay(e as KurulumOlayi);
    };
    window.addEventListener("beforeinstallprompt", yakala);
    return () => window.removeEventListener("beforeinstallprompt", yakala);
  }, []);

  const kapat = () => {
    try {
      window.localStorage.setItem(KAPATILDI, "1");
    } catch {
      // depolama kapalıysa bu oturumluk gizle
    }
    window.dispatchEvent(new Event("storage"));
  };

  const kur = async () => {
    if (!olay) return;
    await olay.prompt();
    await olay.userChoice;
    setOlay(null);
    kapat();
  };

  // Sunucuda ve kurulu cihazda hiç basma; kapatıldıysa da gösterme.
  if (kapatildi !== "" || kurulu !== "tarayici") return null;
  if (!olay && !iosMu) return null;

  return (
    <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-ink/12 bg-white px-5 py-[18px] sm:px-6">
      <span className="mt-[2px] flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-brand text-white">
        <Icon name="download" size={19} />
      </span>

      <div className="min-w-0 grow basis-[240px]">
        <div className="text-[15.5px] font-semibold text-ink">Paneli telefonuna ekle</div>
        {iosMu && !olay ? (
          <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#5C6273]">
            Safari&apos;de alttaki <strong>Paylaş</strong> düğmesine dokun, ardından{" "}
            <strong>Ana Ekrana Ekle</strong>&apos;yi seç. Panel kendi ikonuyla, tam ekran açılır.
          </div>
        ) : (
          <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#5C6273]">
            Ana ekranından tek dokunuşla, tam ekran açılır. Tarayıcı adres çubuğu olmadan.
          </div>
        )}
      </div>

      <div className="flex flex-none flex-wrap gap-2">
        {olay && (
          <button
            type="button"
            onClick={kur}
            className="h-10 rounded-[10px] bg-brand px-[18px] text-[13.5px] font-semibold text-white transition hover:bg-ink"
          >
            Ekle
          </button>
        )}
        <button
          type="button"
          onClick={kapat}
          className="h-10 rounded-[10px] border border-ink/13 bg-white px-[15px] text-[13.5px] font-semibold text-ink transition hover:border-ink"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
