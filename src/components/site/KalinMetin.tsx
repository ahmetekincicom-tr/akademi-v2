import { Fragment } from "react";

/**
 * Panelden girilen metinde `**...**` işaretli kısımları kalın basar.
 *
 * Neden gerekiyor: hero açıklaması satış metni ve içinde bir yeri
 * öne çıkarmak istiyoruz. Alan düz metin olarak saklanıyor ve öyle kalmalı —
 * HTML'e açmak, panele yapıştırılan bir şeyin sayfada kod olarak
 * çalışabilmesi demek olurdu.
 *
 * Bu yüzden yalnızca TEK bir işaret tanınıyor. YasalIcerik'teki daha geniş
 * ayrıştırıcının kardeşi ama satır içi: başlık, liste, bağlantı yok. Hero
 * açıklamasının bunlara ihtiyacı yok ve olmayan bir ihtiyacı desteklemek,
 * panele yanlışlıkla yapıştırılan bir metnin tasarımı bozması demek.
 *
 * Kapatılmamış bir `**` olduğu gibi yazılıyor: metni yutmaktansa işareti
 * göstermek yeğ — yazan kişi hatayı ekranda görür.
 */
export function KalinMetin({ metin }: { metin: string }) {
  const parcalar = metin.split(/\*\*(.+?)\*\*/g);

  return (
    <>
      {parcalar.map((p, i) =>
        // split, yakalanan grupları TEK indekslere koyuyor: kalın olanlar onlar.
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-white">
            {p}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
