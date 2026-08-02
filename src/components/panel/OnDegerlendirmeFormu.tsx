"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { onDegerlendirmeIsaretle } from "@/app/panel/on-degerlendirme/actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";

/**
 * Tally formu iframe'de gömülü. Form gönderildiğinde Tally pencereye
 * "Tally.FormSubmitted" mesajı atıyor; onu yakalayıp adımı işaretliyoruz.
 *
 * Yanındaki elle işaretleme düğmesi bilerek duruyor: postMessage tarayıcı
 * ayarına ya da Tally'nin ileride değişecek mesaj biçimine bağlı, tek yol
 * olarak bırakılamaz. Öğrenci formu doldurup mesaj gelmezse tıkanmaz.
 */
export function OnDegerlendirmeFormu({ src, tamamMi }: { src: string; tamamMi: boolean }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [gonderildi, setGonderildi] = useState(false);

  const isaretle = (sessiz: boolean) => {
    startTransition(async () => {
      const r = await onDegerlendirmeIsaretle();
      if (r?.error) {
        if (!sessiz) bildir.hata(r.error);
        return;
      }
      if (!sessiz) bildir.basarili("Ön değerlendirme tamamlandı olarak işaretlendi.");
      router.refresh();
    });
  };

  useEffect(() => {
    const dinle = (e: MessageEvent) => {
      if (typeof e.origin === "string" && !e.origin.includes("tally.so")) return;
      const veri = typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      if (veri.includes("Tally.FormSubmitted")) {
        setGonderildi(true);
        isaretle(true);
      }
    };
    window.addEventListener("message", dinle);
    return () => window.removeEventListener("message", dinle);
    // isaretle her render'da yeniden kuruluyor; dinleyici bir kez bağlansın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="overflow-hidden rounded-[16px] border border-ink/10 bg-white">
        <iframe
          src={src}
          title="Ön değerlendirme formu"
          className="h-[720px] w-full border-0"
          loading="lazy"
        />
      </div>

      {!tamamMi && !gonderildi && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={islemde}
            onClick={() => isaretle(false)}
            className="h-10 flex-none rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-ink disabled:opacity-50"
          >
            Formu doldurdum
          </button>
          <span className="min-w-0 grow basis-[240px] font-mono text-[11px] text-[#656B7A]">
            Gönderdikten sonra kendiliğinden işaretlenir. İşaretlenmezse bu düğmeyi kullan.
          </span>
        </div>
      )}
    </>
  );
}
