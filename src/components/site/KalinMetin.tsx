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
 *
 * `kalinSinif` varsayılanı hero için beyaz; açık zeminde kullanılırken
 * geçilmesi ZORUNLU, yoksa kalın kısım beyaz üstüne beyaz kalır.
 */
export function KalinMetin({ metin, kalinSinif = "text-white" }: { metin: string; kalinSinif?: string }) {
  const parcalar = metin.split(/\*\*(.+?)\*\*/g);

  return (
    <>
      {parcalar.map((p, i) =>
        // split, yakalanan grupları TEK indekslere koyuyor: kalın olanlar onlar.
        i % 2 === 1 ? (
          <strong key={i} className={`font-semibold ${kalinSinif}`}>
            {p}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
