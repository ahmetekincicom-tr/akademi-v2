import Link from "next/link";
import { Icon } from "@/components/Icon";
import { paraBicimi } from "@/lib/odeme";
import type { PanelBildirimleri } from "@/lib/bildirimler";

/**
 * Genel bakışın bildirim kutusu.
 *
 * Panelde bir şeyin değiştiğini fark etmenin tek yolu sekmeleri tek tek
 * dolaşmaktı: ödeme açıldı mı, kayıt geldi mi, soruya cevap yazıldı mı.
 * Kutu bunları tek yerde topluyor ve her satır doğrudan ilgili sekmeye
 * gidiyor — okumak değil, oraya gitmek için var.
 *
 * Bir şey yoksa kutu yine duruyor ama sessiz halde. Görünüp kaybolan bir
 * kutu, sayfanın yerleşimini her girişte değiştiriyordu.
 */
export function BildirimKutusu({ bildirim }: { bildirim: PanelBildirimleri }) {
  const { liste, odemeBekliyor } = bildirim;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-ink/7 px-5 py-4 sm:px-6">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand/11 text-brand">
          <Icon name="bell" size={16} />
        </span>
        <h2 className="flex-1 font-heading text-[17px] font-semibold tracking-[-0.02em]">Bildirimler</h2>
        {liste.length > 0 && (
          <span className="flex-none rounded-full bg-brand px-[9px] py-[3px] font-mono text-[10px] font-semibold text-white">
            {liste.length}
          </span>
        )}
      </div>

      {liste.length === 0 ? (
        <p className="px-5 py-8 text-center text-[14px] leading-[1.6] text-[#656B7A] sm:px-6">
          Şu an bekleyen bir şey yok. Yeni bir ders planlandığında, kayıtların eklendiğinde ya da sorununa
          cevap yazıldığında burada göreceksin.
        </p>
      ) : (
        <div className="flex flex-col">
          {liste.map((b) => {
            const uyari = b.ton === "uyari";
            return (
              <Link
                key={b.anahtar}
                href={b.yol}
                className="group flex items-center gap-3 border-b border-ink/7 px-5 py-[14px] transition last:border-b-0 hover:bg-mist sm:px-6"
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px]"
                  style={
                    uyari
                      ? { background: "rgba(229,72,77,0.12)", color: "#B4232A" }
                      : { background: "#EEF2FC", color: "#1C56F3" }
                  }
                >
                  <Icon name={b.ikon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14.5px] leading-[1.3] font-semibold text-ink">{b.baslik}</span>
                    {/*
                      Ödeme satırında tutar başlığın yanında duruyor: "bekleyen
                      ödemen var" tek başına ne kadar olduğunu söylemiyor ve
                      kişi tıklamadan karar veremiyor.
                    */}
                    {uyari && odemeBekliyor && (
                      <span
                        className="rounded-full px-[8px] py-[2px] font-mono text-[10.5px] font-semibold"
                        style={{ background: "rgba(229,72,77,0.12)", color: "#B4232A" }}
                      >
                        {paraBicimi.format(odemeBekliyor.tutar)}
                      </span>
                    )}
                  </span>
                  <span className="mt-[3px] block text-[13px] leading-[1.5] text-[#656B7A]">{b.aciklama}</span>
                </span>
                <Icon
                  name="chevronRight"
                  size={15}
                  className="flex-none text-[#A6ABB8] transition group-hover:text-brand"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
