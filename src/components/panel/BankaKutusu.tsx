"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useNativeUygulama } from "@/lib/native";
import type { Banka } from "@/lib/odeme";

/**
 * Havale bilgileri. IBAN ve açıklama elle kopyalanacak dizeler olduğu için
 * kopyala düğmesi var: mobilde uzun bir IBAN'ı seçmek zahmetli ve yanlış
 * kopyalama ödemenin kaybolmasına yol açıyor.
 */
export function BankaKutusu({ banka }: { banka: Banka }) {
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);
  const native = useNativeUygulama();

  // Native uygulamada havale bilgisi gösterilmiyor. Apple'ın 3.1.3 maddesi
  // uygulama içinden dışarıdaki bir ödemeye yönlendirmeyi kısıtlıyor; IBAN
  // göstermek bu şekilde okunabilir ve incelemede reddedilme sebebi olur.
  // Öğrenci ödemeyi web'den yapıyor, uygulama erişim için.
  if (native) return null;

  const kopyala = async (anahtar: string, metin: string) => {
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalanan(anahtar);
      setTimeout(() => setKopyalanan((k) => (k === anahtar ? null : k)), 2000);
    } catch {
      // Pano izni yoksa kullanıcı elle seçebilir; sessizce geç.
    }
  };

  const satirlar: { etiket: string; deger: string | null; kopya?: string; mono?: boolean }[] = [
    { etiket: "Hesap sahibi", deger: banka.unvan },
    { etiket: "Banka", deger: banka.banka },
    { etiket: "IBAN", deger: banka.iban, kopya: banka.iban?.replace(/\s+/g, ""), mono: true },
    { etiket: "Açıklama", deger: banka.aciklama, kopya: banka.aciklama ?? undefined },
  ];

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E6E8EF] bg-white lg:rounded-[18px]">
      <div className="flex flex-col gap-1 px-4 pt-3.5 pb-2.5 lg:px-[22px] lg:pt-5 lg:pb-4">
        <h2 className="text-[15px] font-bold text-ink lg:text-[17px]">Hesap bilgileri</h2>
        <p className="hidden text-[13px] text-[#5B6478] lg:block">
          Havale veya EFT ile aşağıdaki hesaba gönder.{banka.aciklama ? " Açıklamayı aynen yazmayı unutma." : ""}
        </p>
      </div>
      <dl>
        {satirlar
          .filter((s) => s.deger)
          .map((s) => {
            const kopyalandi = kopyalanan === s.etiket;
            return (
              <div
                key={s.etiket}
                className="flex items-center gap-2.5 border-t border-[#F1F3F7] px-4 py-3 lg:grid lg:grid-cols-[150px_minmax(0,1fr)_auto] lg:gap-4 lg:px-[22px] lg:py-3.5"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-[3px] lg:contents">
                  <dt className="font-mono text-[9px] tracking-[0.14em] text-[#8A92A6] uppercase lg:text-[10px]">{s.etiket}</dt>
                  <dd
                    className={`text-[13px] font-semibold break-all text-ink lg:text-[15px] ${s.mono ? "font-mono" : ""}`}
                  >
                    {s.deger}
                  </dd>
                </div>
                {s.kopya ? (
                  <button
                    type="button"
                    onClick={() => kopyala(s.etiket, s.kopya!)}
                    aria-label={`${s.etiket} kopyala`}
                    className={`flex h-11 w-11 flex-none items-center justify-center gap-1.5 rounded-[11px] text-[12px] font-semibold transition lg:h-[34px] lg:w-auto lg:rounded-[9px] lg:px-3 ${
                      kopyalandi
                        ? "bg-[#E3F6EE] text-[#12825A]"
                        : "border border-[#E1E4EC] text-ink hover:border-brand hover:text-brand"
                    }`}
                  >
                    <Icon name={kopyalandi ? "check" : "copy"} size={14} strokeWidth={2.2} />
                    <span className="hidden lg:inline">{kopyalandi ? "Kopyalandı" : "Kopyala"}</span>
                  </button>
                ) : (
                  <span className="hidden lg:block" />
                )}
              </div>
            );
          })}
      </dl>
    </div>
  );
}
