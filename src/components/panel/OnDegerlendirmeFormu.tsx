"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Icon } from "@/components/Icon";

/**
 * Tally formu iframe'de gömülü.
 *
 * Form gönderildiğinde Tally pencereye "Tally.FormSubmitted" mesajı atıyor.
 * O mesaj artık YALNIZCA EKRANI değiştiriyor — "cevabın alındı" der ve
 * sayfayı tazeler; adımı işaretlemez.
 *
 * Sebebi: postMessage tarayıcıdan geliyor, yani katılımcının kendi
 * bilgisayarından. Ona dayanarak damga atmak, katılımcının kendini
 * işaretlemesiyle aynı şey. Damgayı Tally'nin sunucusu atıyor
 * (app/api/formlar/tally), imzasıyla.
 *
 * Elle işaretleme düğmesi KALDIRILDI: formu hiç açmadan basılabiliyordu ve
 * bu adım eğitim planlamasının kapısı. Elle düzeltme artık yönetim
 * tarafında.
 */
export function OnDegerlendirmeFormu({ src, tamamMi }: { src: string; tamamMi: boolean }) {
  const router = useRouter();
  const [gonderildi, setGonderildi] = useState(false);

  useEffect(() => {
    const dinle = (e: MessageEvent) => {
      if (typeof e.origin === "string" && !e.origin.includes("tally.so")) return;
      const veri = typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      if (!veri.includes("Tally.FormSubmitted")) return;

      setGonderildi(true);
      /*
        Tazeleme, webhook'un damgayı bu arada yazmış olma ihtimali için.
        Genelde saniyeler sürüyor ama garanti değil; ekran "alındı" diyor,
        adım kartı damga gelince kapanıyor.
      */
      router.refresh();
    };
    window.addEventListener("message", dinle);
    return () => window.removeEventListener("message", dinle);
  }, [router]);

  return (
    <>
      {(tamamMi || gonderildi) && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[14px] border border-brand/30 bg-brand/8 px-5 py-4">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand text-white">
            <Icon name="check" size={16} strokeWidth={2.8} />
          </span>
          <div className="min-w-0 grow basis-[240px]">
            <div className="text-[14.5px] font-semibold">Ön değerlendirmen alındı</div>
            <div className="mt-[2px] text-[13px] text-[#5C6273]">
              Cevaplarını inceleyip tarih planlaması için sana döneceğiz.
            </div>
          </div>
        </div>
      )}

      {/*
        data-tally-src + embed.js: betik iframe'i içeriğin boyuna göre
        büyütüyor, böylece form sayfaya gömülü tek bir blok gibi duruyor.
        Sabit yükseklikli iframe'de soruları görmek için içeride ayrı bir
        kaydırma gerekiyordu.
      */}
      <div className="rounded-[16px] border border-ink/10 bg-white p-4 sm:p-6">
        <iframe
          data-tally-src={src}
          title="Ön değerlendirme formu"
          loading="lazy"
          width="100%"
          height={200}
          className="w-full border-0"
        />
      </div>
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />

      {!tamamMi && (
        <p className="mt-4 font-mono text-[11px] leading-[1.6] text-[#656B7A]">
          Formu gönderdiğinde bu adım kendiliğinden işaretlenir; birkaç dakika sürebilir.
          İşaretlenmezse bize yaz.
        </p>
      )}
    </>
  );
}
