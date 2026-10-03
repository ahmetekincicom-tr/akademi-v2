import { Kutu } from "@/components/panel/Iskelet";

/* Birebir eğitim: başlık, koyu "sıradaki oturum" bandı, [takvim | yaklaşan +
   klasör], geçmiş oturumlar — page.tsx ile aynı sıra ve ölçü. */
export default function Loading() {
  const kart = "rounded-[18px] border border-[#E6E8EF] bg-white";
  return (
    <main role="status" aria-label="Sayfa yükleniyor" className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
      <Kutu className="h-[28px] w-[200px] rounded-[9px]" />
      <section className="flex items-center gap-4 rounded-[20px] bg-ink p-[18px] lg:gap-8 lg:p-7">
        <Kutu koyu className="h-[86px] w-[72px] flex-none rounded-[14px] lg:h-32 lg:w-[118px]" />
        <div className="flex-1">
          <Kutu koyu className="h-[12px] w-[160px]" />
          <Kutu koyu className="mt-3 h-[26px] w-[360px] max-w-full rounded-[8px]" />
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-[18px]">
        <div className={`${kart} p-[22px]`}>
          <Kutu className="h-[16px] w-[120px]" />
          <div className="mt-5 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 21 }, (_, i) => (
              <Kutu key={i} className="h-[46px] rounded-[10px] sm:h-[52px]" />
            ))}
          </div>
        </div>
        <div className={`${kart} hidden h-[450px] lg:block`} />
      </div>
      <div className={`${kart} h-[240px]`} />
    </main>
  );
}
