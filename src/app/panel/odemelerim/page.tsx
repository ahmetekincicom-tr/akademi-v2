import { getOdemelerim, paraBicimi } from "@/lib/odeme";
import { durumStil } from "@/lib/admin/shared";
import { odemeDurumEtiket } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

export default async function OdemelerimPage() {
  const { satirlar, bekleyenTutar, bekleyenAdet } = await getOdemelerim();

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Ödemelerim
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitim ücretlerinin kaydı. Ödemen bize ulaştığında durumu &quot;Ödendi&quot; olarak işaretliyoruz.
      </p>

      {bekleyenAdet > 0 && (
        <div className="mt-[22px] flex flex-wrap items-center gap-4 rounded-2xl border border-[#E0A21C]/35 bg-[#FDF6E7] px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-[#E0A21C]/18 text-[#8A6210]">
            <Icon name="card" size={19} />
          </span>
          <div className="min-w-0 grow basis-[220px]">
            <div className="text-[15.5px] font-semibold">
              Bekleyen tutar · {paraBicimi.format(bekleyenTutar)}
            </div>
            <div className="mt-[2px] text-[13.5px] text-[#5C6273]">
              {bekleyenAdet} kayıt onay bekliyor.
            </div>
          </div>
        </div>
      )}

      {satirlar.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="card" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Henüz bir ödeme kaydın yok. Eğitim ücreti tanımlandığında burada görünecek.
          </p>
        </div>
      ) : (
        <div className="mt-[26px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {satirlar.map((s) => {
            // Etiket admin tarafıyla ortak: durumStil renkleri bu metinlere göre
            // seçiyor, kendi sözlüğümü yazarsam rozetler griye düşüyordu.
            const etiket = odemeDurumEtiket[s.durum] ?? s.durum;
            const st = durumStil(etiket);
            return (
              <div
                key={s.id}
                className="flex flex-col gap-3 border-b border-ink/7 px-5 py-4 last:border-b-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-[16px]"
              >
                {/* basis yalnızca sm'den itibaren: kapsayıcı mobilde flex-col
                    olduğu için orada basis genişliği değil YÜKSEKLİĞİ belirler
                    ve satırın ortasında boş bir blok bırakır. */}
                <div className="min-w-0 sm:grow sm:basis-[220px]">
                  <div className="text-[15px] leading-[1.3] font-semibold text-ink">
                    {paraBicimi.format(s.tutar)}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">
                    {s.kurs ?? "Genel"} · {tarihBicimi.format(new Date(s.tarih))}
                    {s.yontem ? ` · ${s.yontem}` : ""}
                  </div>
                  {s.not && <div className="mt-[6px] text-[13px] text-[#5C6273]">{s.not}</div>}
                </div>

                {s.faturaNo && (
                  <div className="flex-none font-mono text-[10.5px] text-[#656B7A]">
                    Fatura {s.faturaNo}
                  </div>
                )}

                <span
                  className="w-fit flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                  style={{ background: st.bg, color: st.renk }}
                >
                  {etiket}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
