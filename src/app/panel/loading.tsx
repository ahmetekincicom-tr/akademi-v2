import { OzetKartiIskeleti, ListeKartiIskeleti, Kutu } from "@/components/panel/Iskelet";

/**
 * Genel bakışın yükleme iskeleti.
 *
 * Bu sayfa panelin en yavaş açılanı: beş ayrı sorgu birden çalışıyor
 * (profil, eğitimler, başlangıç adımları, bildirimler, oturumlar). Beyaz
 * ekranın en uzun görüldüğü yer de burası.
 *
 * Yerleşim page.tsx ile birebir aynı sırada: koyu karşılama bloğu, dört
 * özet kutusu, sonra iki sütun. Sıra ya da ölçü tutmazsa içerik gelince
 * sayfa zıplıyor — o, beyaz ekrandan daha rahatsız edici, çünkü göz bir
 * şeyi okumaya başlamışken kayıyor.
 */
export default function Loading() {
  return (
    <main
      // Ekran okuyucu iskeletin kutularını değil, tek bir cümleyi duyuyor.
      role="status"
      aria-label="Sayfa yükleniyor"
      className="flex flex-col gap-5 p-4 pb-14 sm:gap-[22px] sm:p-[34px]"
    >
      {/* Karşılama bloğu koyu; iskeletleri de koyu zemin sürümünde. */}
      <section className="rounded-2xl bg-ink px-6 py-7 sm:px-8 sm:py-8">
        <Kutu koyu className="h-[10px] w-[104px]" />
        <Kutu koyu className="mt-[14px] h-[30px] w-[240px] max-w-[80%] rounded-[9px]" />
        <Kutu koyu className="mt-[14px] h-[14px] w-[300px] max-w-full" />
      </section>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <OzetKartiIskeleti key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.44fr)]">
        <div className="flex flex-col gap-5">
          <ListeKartiIskeleti satir={2} simge={false} />
        </div>
        <div className="flex flex-col gap-5">
          <ListeKartiIskeleti satir={3} />
        </div>
      </div>
    </main>
  );
}
