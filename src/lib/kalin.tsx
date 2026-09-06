import { Fragment, type ReactNode } from "react";

/*
  Panelden girilen düz metinde **çift yıldız** arası KALIN gösterilir.

  Neden tam bir zengin metin editörü değil: panele yapıştırılan metin düz kalsın,
  veritabanında da okunur/taşınabilir dursun istiyoruz. `**...**` hem yazması
  kolay hem güvenli — HTML enjeksiyonu yok, React zaten metni kaçırıyor; biz
  yalnızca yıldız çiftlerini <strong>'a çeviriyoruz.

  Renk verilmiyor, yalnızca kalınlık: metin hem açık zeminde (koyu yazı) hem
  koyu hero zemininde (beyaz yazı) kullanılıyor; rengi mevcut yazıdan miras
  alsın ki ikisinde de doğru dursun.
*/
export function kalinVurgula(metin: string): ReactNode {
  // Yakalama gruplu split: ayraçlar (`**...**`) da dizide kalıyor.
  return metin.split(/(\*\*[^*]+\*\*)/g).map((parca, i) => {
    if (parca.length > 4 && parca.startsWith("**") && parca.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {parca.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{parca}</Fragment>;
  });
}

/**
 * Aynı metnin DÜZ hâli: meta açıklaması, JSON-LD, e-posta gibi biçimlendirmenin
 * anlamsız olduğu yerlerde `**` işaretleri metne sızmasın diye ayıklanıyor.
 */
export function kalinsiz(metin: string): string {
  return metin.replace(/\*\*([^*]+)\*\*/g, "$1");
}
