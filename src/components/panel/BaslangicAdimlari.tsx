"use client";

import Link from "next/link";
import { useNativeUygulama } from "@/lib/native";
import { Icon } from "@/components/Icon";
import type { Adim } from "@/lib/baslangic";

/**
 * Sürecin neresinde olunduğunu gösteren şerit.
 *
 * Önceki hâli dört adımı da tam satır olarak listeliyordu: başlık, açıklama
 * ve düğmeyle birlikte ekranın yarısını kaplıyor, altındaki her şeyi
 * katlamanın altına itiyordu. Oysa dört satırın üçü her zaman ya bitmiş ya
 * da sırası gelmemiş adımlardı — okunacak tek satır sıradaki adımdı.
 *
 * Şerit bunu ayırıyor: üstte adımların tamamı küçük halkalar hâlinde (nerede
 * olduğunu bir bakışta veriyor), altında yalnızca sıradaki adımın metni ve
 * düğmesi. Bitmiş adımın açıklamasını okumaya gerek yok, sırası gelmemiş
 * adımın düğmesi zaten çalışmıyordu.
 *
 * Dört adım da bitince çağıran sayfa bunu hiç basmıyor.
 */
export function BaslangicAdimlari({ adimlar }: { adimlar: Adim[] }) {
  const native = useNativeUygulama();

  // Ödeme adımı uygulamada listelenmiyor; "Ödemelerim" düğmesi IBAN'a çıkıyor
  // ve bu 3.1.3'ün yasakladığı yönlendirme sayılıyor.
  const gorunen = native ? adimlar.filter((a) => a.anahtar !== "odeme") : adimlar;
  const kalan = gorunen.filter((a) => !a.tamam).length;

  // Çağıran sayfa "hepsi tamam" durumunda bu kartı hiç basmıyor. Native'de
  // ödeme adımı çıkarıldığı için geriye tamamlanmış adımlar kalabiliyor;
  // o durumda şerit yine görünmesin.
  if (kalan === 0) return null;

  const tamamSayi = gorunen.length - kalan;
  const siradakiIndeks = gorunen.findIndex((a) => !a.tamam);
  const siradaki = gorunen[siradakiIndeks];

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      {/* Üst şerit: adım halkaları ve sayaç. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-ink/7 px-5 py-[13px] sm:px-6">
        <span className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Kurulum</span>

        <div className="flex flex-1 items-center gap-[6px]">
          {gorunen.map((a, i) => {
            const bu = i === siradakiIndeks;
            return (
              <div key={a.anahtar} className="flex flex-1 items-center gap-[6px]">
                <span
                  title={a.baslik}
                  className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full font-mono text-[10px] font-semibold"
                  style={
                    a.tamam
                      ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
                      : bu
                        ? { background: "#1C56F3", color: "#FFFFFF" }
                        : { background: "#EEF2FC", color: "#8A90A0" }
                  }
                >
                  {a.tamam ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                </span>
                {/* Halkalar arası çizgi; son halkadan sonra yok. */}
                {i < gorunen.length - 1 && (
                  <span
                    className="h-[2px] min-w-[10px] flex-1 rounded-full"
                    style={{ background: a.tamam ? "rgba(28,86,243,0.35)" : "#EEF2FC" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <span className="flex-none font-mono text-[11px] text-[#656B7A]">
          {tamamSayi}/{gorunen.length}
        </span>
      </div>

      {/* Alt satır: yalnızca sıradaki adım. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
        <div className="min-w-0 grow basis-[240px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14.5px] leading-[1.3] font-semibold text-ink">{siradaki.baslik}</span>
            <span className="rounded-full bg-brand/12 px-[8px] py-[2px] font-mono text-[9px] tracking-[0.1em] text-brand uppercase">
              Sıradaki
            </span>
          </div>
          <div className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">
            {siradaki.bekliyor ?? siradaki.aciklama}
          </div>
        </div>

        {siradaki.yol && siradaki.eylem && (
          <Link
            href={siradaki.yol}
            className="inline-flex h-9 flex-none items-center gap-[7px] rounded-[9px] bg-brand px-4 text-[13px] font-semibold text-white transition hover:bg-ink"
          >
            {siradaki.eylem}
            <Icon name="arrowRight" size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
