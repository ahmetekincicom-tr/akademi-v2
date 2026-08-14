"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { odemeyeGec } from "@/app/panel/odemelerim/actions";
import { Icon } from "@/components/Icon";

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

/**
 * Ödeme öncesi onay adımı.
 *
 * Tek tıkla iyzico'ya atlamıyoruz: mesafeli satış mevzuatı, ödeme alınmadan
 * önce sözleşmenin onaylanmasını istiyor ve onayın kaydı bu adımda alınıyor.
 * Ayrı bir sayfa olması ayrıca öğrenciye neyi ödediğini gösteriyor — bekleyen
 * birden çok kaydı olabiliyor.
 */
export function OdemeOnayi({
  id,
  tutar,
  kurs,
  not,
}: {
  id: string;
  tutar: number;
  kurs: string | null;
  not: string | null;
}) {
  const [onay, setOnay] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, basla] = useTransition();

  function gonder() {
    setHata(null);
    basla(async () => {
      const { adres, hata: h } = await odemeyeGec(id);
      if (h || !adres) {
        setHata(h ?? "Ödeme başlatılamadı.");
        return;
      }
      // router.push kullanılmıyor: hedef bu uygulamanın dışında, iyzico'nun
      // barındırdığı ödeme sayfası.
      window.location.href = adres;
    });
  }

  return (
    <div className="mt-[26px] max-w-[560px]">
      <div className="rounded-2xl border border-ink/10 bg-white p-6">
        <div className="font-mono text-[9.5px] tracking-[0.18em] text-[#656B7A] uppercase">Ödenecek tutar</div>
        <div className="mt-2 font-heading text-[34px] leading-none font-semibold tracking-[-0.03em]">
          {paraBicimi.format(tutar)}
        </div>
        <div className="mt-3 text-[14px] text-[#5C6273]">{kurs ?? "Eğitim ücreti"}</div>
        {not && <div className="mt-[10px] text-[13.5px] leading-[1.55] text-[#5C6273]">{not}</div>}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-[10px] rounded-2xl border border-ink/10 bg-white p-5">
        <input
          type="checkbox"
          checked={onay}
          onChange={(e) => setOnay(e.target.checked)}
          className="mt-[3px] h-[17px] w-[17px] flex-none accent-brand"
        />
        <span className="text-[13.5px] leading-[1.6] text-[#3A3F4F]">
          <Link href="/satis-sozlesmesi" target="_blank" className="font-semibold text-brand underline">
            Mesafeli satış sözleşmesini
          </Link>{" "}
          ve{" "}
          <Link href="/iptal-iade-politikasi" target="_blank" className="font-semibold text-brand underline">
            iptal ve iade politikasını
          </Link>{" "}
          okudum, onaylıyorum.
        </span>
      </label>

      {hata && (
        <div className="mt-4 rounded-[12px] border border-[#E5484D]/30 bg-[#FDF0F0] px-4 py-3 text-[13.5px] text-[#8E2226]">
          {hata}
        </div>
      )}

      <button
        type="button"
        onClick={gonder}
        disabled={!onay || islemde}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-ink text-[14.5px] font-semibold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Icon name="card" size={16} />
        {islemde ? "Ödeme sayfası açılıyor…" : "Kartla ödemeye geç"}
      </button>

      <p className="mt-3 text-center text-[12.5px] leading-[1.55] text-[#656B7A]">
        Ödeme iyzico altyapısıyla alınır. Kart bilgilerin bu sayfaya girilmez ve bize hiçbir zaman ulaşmaz.
      </p>

      <Link
        href="/panel/odemelerim"
        className="mt-5 block text-center text-[13.5px] font-medium text-[#5C6273] hover:text-ink"
      >
        Vazgeç
      </Link>
    </div>
  );
}
