import { Kutu } from "@/components/panel/Iskelet";

/**
 * Genel bakışın yükleme iskeleti.
 *
 * Bu sayfa panelin en yavaş açılanı: beş ayrı sorgu birden çalışıyor
 * (profil, eğitimler, başlangıç adımları, bildirimler, oturumlar).
 *
 * Yerleşim page.tsx ile aynı: karşılama satırı, koyu kurulum bandı, sonra
 * [program | yaklaşan ders] ve [kısayollar | bildirimler]. Sıra ya da ölçü
 * tutmazsa içerik gelince sayfa zıplıyor.
 */
export default function Loading() {
  const kart = "rounded-[18px] border border-[#E6E8EF] bg-white";
  return (
    <main
      role="status"
      aria-label="Sayfa yükleniyor"
      className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9"
    >
      <div className="px-1 sm:px-0">
        <Kutu className="h-[10px] w-[150px]" />
        <Kutu className="mt-[10px] h-[28px] w-[420px] max-w-[90%] rounded-[9px]" />
      </div>

      <section className="rounded-[20px] bg-ink p-[18px] sm:p-[26px]">
        <Kutu koyu className="h-[10px] w-[70px]" />
        <Kutu koyu className="mt-2 h-[20px] w-[200px] rounded-[7px]" />
        <div className="mt-5 grid grid-cols-1 gap-2 xl:grid-cols-4 xl:gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Kutu key={i} koyu className="h-12 rounded-[12px] xl:h-[120px] xl:rounded-[14px]" />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-[18px]">
        <div className={`${kart} h-[300px] sm:h-[210px]`} />
        <div className={`${kart} h-[170px] sm:h-[210px]`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[150px] rounded-[16px] border border-[#E6E8EF] bg-white" />
          ))}
        </div>
        <div className={`${kart} h-[150px]`} />
      </div>
    </main>
  );
}
