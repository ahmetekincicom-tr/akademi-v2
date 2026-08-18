"use client";

import Link from "next/link";
import { useNativeUygulama } from "@/lib/native";
import { Icon } from "@/components/Icon";
import type { Adim } from "@/lib/baslangic";

/**
 * Sürecin neresinde olduğunu gösteren karşılama kartı. Dört adım da bitince
 * çağıran sayfa bunu hiç basmıyor — kalıcı bir "hepsi tamam" kutusu panelin
 * üstünde yer kaplamasın.
 *
 * Adımların bir kısmı bize bağlı (ödemeyi biz onaylıyoruz). Öğrenciye tıklanacak
 * bir şey vermek yerine neyi beklediğini yazıyoruz; işlemeyen düğme koymuyoruz.
 */
export function BaslangicAdimlari({ adimlar }: { adimlar: Adim[] }) {
  const native = useNativeUygulama();

  // Ödeme adımı uygulamada listelenmiyor; "Ödemelerim" düğmesi IBAN'a çıkıyor
  // ve bu 3.1.3'ün yasakladığı yönlendirme sayılıyor.
  const gorunen = native ? adimlar.filter((a) => a.anahtar !== "odeme") : adimlar;
  const kalan = gorunen.filter((a) => !a.tamam).length;

  // Çağıran sayfa "hepsi tamam" durumunda bu kartı hiç basmıyor. Native'de
  // ödeme adımı çıkarıldığı için geriye tamamlanmış adımlar kalabiliyor;
  // o durumda kart yine görünmesin.
  if (kalan === 0) return null;

  const tamamSayi = gorunen.length - kalan;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/7 px-5 py-[18px] sm:px-6">
        <div className="min-w-0">
          <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Başlangıç adımların</h2>
          <p className="mt-1 text-[13.5px] text-[#5C6273]">
            {kalan === 1 ? "Son bir adım kaldı." : `${kalan} adım kaldı.`} Tamamlandığında bu kart kaybolur.
          </p>
        </div>
        {/* Sayı + çubuk: listeye bakmadan nerede olunduğunu söylüyor. */}
        <div className="min-w-[150px] flex-none">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">Tamamlanan</span>
            <span className="font-heading text-[14px] font-semibold tracking-[-0.02em] text-ink">
              {tamamSayi}/{gorunen.length}
            </span>
          </div>
          <div className="mt-[7px] h-[5px] w-full overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${Math.round((tamamSayi / gorunen.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="divide-y divide-ink/7">
        {gorunen.map((a, i) => {
          const sirada = !a.tamam && gorunen.slice(0, i).every((o) => o.tamam);
          return (
            <li
              key={a.anahtar}
              className={`flex flex-wrap items-start gap-3 border-l-[3px] px-5 py-4 sm:gap-4 sm:px-6 ${
                sirada ? "border-brand bg-[#F7F9FF]" : "border-transparent"
              }`}
            >
              <span
                className={`mt-[1px] flex h-6 w-6 flex-none items-center justify-center rounded-full font-mono text-[11px] ${
                  a.tamam
                    ? "bg-[rgba(28,86,243,0.12)] text-brand"
                    : sirada
                      ? "bg-brand text-white"
                      : "bg-mist text-[#656B7A]"
                }`}
              >
                {a.tamam ? <Icon name="check" size={13} strokeWidth={2.8} /> : i + 1}
              </span>

              {/* basis ile sarmalıyor: dar ekranda metin ezilmesin, eylem alt satıra insin. */}
              <div className="min-w-0 grow basis-[220px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[14.5px] font-semibold ${a.tamam ? "text-[#656B7A]" : "text-ink"}`}>
                    {a.baslik}
                  </span>
                  {sirada && (
                    <span className="rounded-full bg-brand/12 px-[8px] py-[2px] font-mono text-[9px] tracking-[0.1em] text-brand uppercase">
                      Sıradaki
                    </span>
                  )}
                </div>
                <div className="mt-[3px] text-[13px] leading-[1.5] text-[#656B7A]">
                  {a.tamam ? a.aciklama : (a.bekliyor ?? a.aciklama)}
                </div>
              </div>

              {a.yol && a.eylem && (
                <Link
                  href={a.yol}
                  className="h-9 flex-none rounded-[9px] bg-brand px-4 text-[13px] leading-9 font-semibold text-white transition hover:bg-ink"
                >
                  {a.eylem}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
