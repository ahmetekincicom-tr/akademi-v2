"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { konumEtiketi, cihazEtiketi, type OturumKaydi } from "@/lib/oturum";
import { TR_ZAMAN } from "@/lib/zaman";

const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Hesabın son girişleri — katlanır.
 *
 * Kapalı başlıyor: liste 20 satıra kadar çıkıyor ve hesap sayfasının altına
 * uzun bir kuyruk ekliyordu. Merak eden açıp bakıyor, en son giriş zaten
 * başlıkta duruyor.
 */
export function GirisHareketleri({ oturumlar }: { oturumlar: OturumKaydi[] }) {
  const [acik, setAcik] = useState(false);
  const sonuncu = oturumlar[0];

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        className="flex w-full items-center gap-3 px-5 py-[18px] text-left sm:px-[26px]"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-mist text-[#5C6273]">
          <Icon name="pin" size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-lg font-semibold tracking-[-0.02em]">
            Giriş hareketleri
          </span>
          <span className="mt-[3px] block truncate text-[13px] text-[#5C6273]">
            {sonuncu
              ? `En son: ${konumEtiketi(sonuncu)} · ${anBicimi.format(new Date(sonuncu.tarih))}`
              : "Henüz kayıtlı bir giriş yok."}
          </span>
        </span>
        <Icon
          name="chevronRight"
          size={16}
          className={`flex-none text-[#8A90A0] transition-transform ${acik ? "rotate-90" : ""}`}
        />
      </button>

      {acik && (
        <div className="border-t border-ink/8">
          <p className="px-5 pt-4 text-[13.5px] leading-[1.6] text-[#5C6273] sm:px-[26px]">
            Tanımadığın bir konum veya cihaz görürsen şifreni değiştir ve bize haber ver. Kayıtlar 90 gün
            saklanır, sonra silinir.
          </p>

          {oturumlar.length === 0 ? (
            <div className="px-5 py-6 text-[14.5px] text-[#656B7A] sm:px-[26px]">
              Bir sonraki girişinden itibaren burada listelenecek.
            </div>
          ) : (
            <div className="mt-3">
              {oturumlar.map((o, i) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center gap-3 border-t border-ink/7 px-5 py-[13px] sm:px-[26px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{konumEtiketi(o)}</div>
                    <div className="mt-[3px] truncate font-mono text-[10.5px] text-[#656B7A]">
                      {cihazEtiketi(o)}
                      {o.ip && ` · ${o.ip}`}
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-mono text-[11.5px] text-[#3A3F4F]">
                      {anBicimi.format(new Date(o.tarih))}
                    </div>
                    {i === 0 && (
                      <div className="mt-[3px] font-mono text-[9.5px] tracking-[0.1em] text-brand uppercase">
                        en son
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
