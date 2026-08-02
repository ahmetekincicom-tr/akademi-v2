"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { Banka } from "@/lib/odeme";

/**
 * Havale bilgileri. IBAN elle kopyalanacak bir dize olduğu için kopyala
 * düğmesi var: mobilde uzun bir IBAN'ı seçmek zahmetli ve yanlış kopyalama
 * ödemenin kaybolmasına yol açıyor.
 */
export function BankaKutusu({ banka }: { banka: Banka }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const kopyala = async () => {
    if (!banka.iban) return;
    try {
      await navigator.clipboard.writeText(banka.iban.replace(/\s+/g, ""));
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      // Pano izni yoksa kullanıcı elle seçebilir; sessizce geç.
    }
  };

  return (
    <div className="mt-[22px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
        <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Ödeme bilgileri</h2>
        <p className="mt-1 text-[13.5px] text-[#5C6273]">
          Havale veya EFT ile aşağıdaki hesaba ödeme yapabilirsin.
        </p>
      </div>

      <dl className="divide-y divide-ink/7">
        {banka.unvan && (
          <div className="flex flex-col gap-1 px-5 py-[14px] sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <dt className="font-mono text-[10.5px] tracking-[0.1em] text-[#656B7A] uppercase sm:w-[150px] sm:flex-none">
              Hesap sahibi
            </dt>
            <dd className="min-w-0 text-[14.5px] text-ink">{banka.unvan}</dd>
          </div>
        )}
        {banka.banka && (
          <div className="flex flex-col gap-1 px-5 py-[14px] sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <dt className="font-mono text-[10.5px] tracking-[0.1em] text-[#656B7A] uppercase sm:w-[150px] sm:flex-none">
              Banka
            </dt>
            <dd className="min-w-0 text-[14.5px] text-ink">{banka.banka}</dd>
          </div>
        )}
        {banka.iban && (
          <div className="flex flex-col gap-2 px-5 py-[14px] sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <dt className="font-mono text-[10.5px] tracking-[0.1em] text-[#656B7A] uppercase sm:w-[150px] sm:flex-none">
              IBAN
            </dt>
            <dd className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-mono text-[14px] break-all text-ink">{banka.iban}</span>
              <button
                type="button"
                onClick={kopyala}
                className="inline-flex h-8 flex-none items-center gap-[6px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                <Icon name={kopyalandi ? "check" : "file"} size={13} />
                {kopyalandi ? "Kopyalandı" : "Kopyala"}
              </button>
            </dd>
          </div>
        )}
        {banka.aciklama && (
          <div className="flex flex-col gap-1 px-5 py-[14px] sm:flex-row sm:gap-4 sm:px-6">
            <dt className="font-mono text-[10.5px] tracking-[0.1em] text-[#656B7A] uppercase sm:w-[150px] sm:flex-none">
              Açıklama
            </dt>
            <dd className="min-w-0 text-[14.5px] leading-[1.55] text-ink">{banka.aciklama}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
