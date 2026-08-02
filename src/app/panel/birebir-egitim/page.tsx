import { getEgitimOturumlarim } from "@/lib/egitim-oturumu";
import { durumStil } from "@/lib/admin/shared";
import { seansDurumEtiket, saatBicimi } from "@/lib/admin/format";
import { seansAyir } from "@/lib/seans";
import { guvenliUrl } from "@/lib/guvenli-url";
import { oynatmaCoz } from "@/lib/oynatma";
import { Icon } from "@/components/Icon";
import { SeansKaydi } from "@/components/panel/SeansKaydi";

/**
 * Birebir eğitimin takvimi ve kayıtları. Eğitim bittikten sonra kullanılan
 * görüşme hakları ayrı sayfada: /panel/seanslar.
 */
export default async function PanelBirebirEgitimPage() {
  const oturumlar = await getEgitimOturumlarim();
  const { yaklasan, gecmis } = seansAyir(oturumlar);

  const kart = (o: (typeof oturumlar)[number]) => {
    const etiket = seansDurumEtiket[o.durum];
    const st = durumStil(etiket);
    const toplanti = guvenliUrl(o.toplantiLink);
    // Bağlantı varsa gösteriliyor; durum şartı yok. Kaydı ne zaman
    // paylaşacağına bağlantıyı ekleyerek eğitmen karar veriyor — önceden
    // "yalnızca tamamlandı" şartı vardı ve planlı bir oturuma eklenen
    // klasörü gizliyordu.
    const kayitKaynak = guvenliUrl(o.kayitLink);
    const kayit = kayitKaynak ? oynatmaCoz(o.kayitLink) : null;

    return (
      <div
        key={o.id}
        className="flex flex-col gap-3 border-b border-ink/7 px-5 py-4 last:border-b-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-[16px]"
      >
        <div className="order-2 sm:order-none sm:w-[150px] sm:flex-none">
          <div className="font-mono text-[12px] font-medium text-ink">
            {saatBicimi.format(new Date(o.baslangic))}
          </div>
          <div className="mt-[2px] font-mono text-[10px] text-[#656B7A]">{o.sureDk} dk</div>
        </div>
        <div className="order-1 min-w-0 sm:order-none sm:flex-1">
          <div className="text-[15px] leading-[1.3] font-semibold text-ink">{o.konu || "Eğitim oturumu"}</div>
          <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">{o.program}</div>
        </div>
        <span
          className="order-3 w-fit flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase sm:order-none"
          style={{ background: st.bg, color: st.renk }}
        >
          {etiket}
        </span>
        {toplanti && o.durum === "planlandi" && (
          <a
            href={toplanti}
            target="_blank"
            rel="noreferrer"
            className="order-4 inline-flex h-9 w-fit flex-none items-center gap-[6px] rounded-[9px] bg-brand px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-ink sm:order-none"
          >
            <Icon name="external" size={14} />
            Derse katıl
          </a>
        )}
        {kayit && kayitKaynak && (
          <SeansKaydi video={kayit} kaynak={kayitKaynak} baslik={o.konu || "Eğitim kaydı"} />
        )}
      </div>
    );
  };

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Birebir eğitim
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitim oturumlarının takvimi ve tamamlanan derslerin kayıtları.
      </p>

      {oturumlar.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="calendar" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Henüz planlanmış bir eğitim oturumun yok. Ön değerlendirmen tamamlandıktan sonra tarihleri birlikte
            belirliyoruz.
          </p>
        </div>
      ) : (
        <div className="mt-[26px] flex flex-col gap-5">
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Yaklaşan</h2>
            </div>
            {yaklasan.length === 0 ? (
              <p className="px-5 py-8 text-center text-[14px] text-[#656B7A] sm:px-6">
                Planlanmış oturumun yok.
              </p>
            ) : (
              yaklasan.map(kart)
            )}
          </div>

          {gecmis.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
                <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Geçmiş</h2>
              </div>
              {gecmis.map(kart)}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
