import Link from "next/link";
import { Icon } from "@/components/Icon";
import { IlerlemeHalkasi } from "@/components/panel/IlerlemeHalkasi";
import type { PanelCourse } from "@/lib/panel";

/**
 * "Kaldığın yer" kartı.
 *
 * Panelin girişinde en sık yapılan iş dersin devamına dönmek. Bu bilgi
 * eskiden yalnızca karşılama bloğundaki bir düğmeydi ve düğme dersin ADINI
 * söylemiyordu: kişi neye tıkladığını ancak ders açılınca görüyordu.
 *
 * Kart bilerek koyu değil. Karşılama bloğu zaten koyu; ikisi üst üste
 * gelince sayfanın üstü tek bir siyah kütleye dönüşüyordu. Beyaz zemin
 * üzerinde ince mavi bir çerçeve, koyu blokla yarışmadan öne çıkıyor.
 */
export function SonrakiDersKarti({ kurs }: { kurs: PanelCourse }) {
  const ders = kurs.sonrakiDers;
  const bitti = !ders;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/25 bg-white p-5 sm:p-6">
      {/* Köşedeki ışık: kartı diğer beyaz kutulardan ayıran tek şey çerçeve
          kalmasın; renk sayfanın geri kalanında yok. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-[220px] w-[220px] rounded-full opacity-[0.09] blur-[70px]"
        style={{ background: "#1C56F3" }}
      />

      <div className="relative flex flex-wrap items-center gap-5">
        <IlerlemeHalkasi yuzde={kurs.yuzde} boyut={88} kalinlik={7} />

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-brand uppercase">
            {bitti ? "Program tamamlandı" : "Kaldığın yer"}
          </div>
          <div className="mt-[9px] text-[18px] leading-[1.25] font-semibold tracking-[-0.02em] text-ink">
            {bitti ? kurs.baslik : ders.ad}
          </div>
          <div className="mt-[6px] text-[13px] leading-[1.5] text-[#656B7A]">
            {bitti ? (
              <>Bütün dersleri tamamladın. İstediğin zaman tekrar izleyebilirsin.</>
            ) : (
              <>
                {ders.modulBaslik?.trim() ? `${ders.modulBaslik} · ` : ""}
                {kurs.tamamlanan}/{kurs.dersSayisi} ders tamamlandı
              </>
            )}
          </div>
        </div>

        <Link
          href={
            bitti
              ? `/panel/dersler?kurs=${kurs.slug}`
              : `/panel/dersler?kurs=${kurs.slug}&ders=${ders.id}`
          }
          className="inline-flex h-[48px] w-full flex-none items-center justify-center gap-[9px] rounded-[12px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink sm:w-auto"
        >
          <Icon name={bitti ? "playCircle" : "play"} size={17} />
          {bitti ? "Tekrar izle" : "Derse devam et"}
        </Link>
      </div>
    </div>
  );
}
