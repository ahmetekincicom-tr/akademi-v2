import Link from "next/link";
import { Icon } from "@/components/Icon";
import { olculenWhatsapp } from "@/lib/iletisim";
import type { IkonluSatir } from "@/lib/courses";

/**
 * Eğitim hero'sunun altındaki değer önermeleri ve tek eylem.
 *
 * Yerini aldığı şey dört bilgi kartıydı (süre, format, modül, seviye). Dar
 * ekranda 2×2 bir kutu ızgarası oluyor, hero'nun yarısını kaplıyordu ve
 * söylediği şey satın alma kararını taşımıyordu — üstelik "seviye" çoğu
 * programda boştu, yani kutulardan biri hep boş bir kart olarak duruyordu.
 *
 * Süre bilgisi müfredatta ve eğitim kartlarında duruyor; hero'nun işi ikna
 * etmek, künye yazmak değil.
 *
 * Başlıklar artık eğitim özelinde panelden yazılıyor (course.haplar).
 * Doldurulmadıysa akademinin ortak listesi basılıyor — gerekçesi
 * lib/courses.ts içindeki VARSAYILAN_HAPLAR'da.
 */

export function HeroDegerler({ degerler }: { degerler: IkonluSatir[] }) {
  return (
    <div className="mt-9">
      {/*
        Dar ekranda TEK sütun ve ORTALI, geniş ekranda sarmalanan satır.

        Serbest sarmalama bırakıldığında telefonda 2-1-1 gibi düzensiz bir
        merdiven oluşuyordu: etiketler çok farklı uzunlukta ("%100 Uygulamalı"
        ile "Ömür Boyu Ücretsiz Destek" arasında iki kat fark var) ve iki
        sütuna tek satır hâlinde sığmıyorlar. Kısaltmak yerine tek sütun
        seçildi: hap içinde satır kırmak, yuvarlak kenarlı bir öğeyi kart gibi
        gösteriyor.

        items-center hapları tam genişlikte esnetmek yerine içeriklerinin
        genişliğine indiriyor. Hero mobilde ortalandığı için bu gerekli —
        esneyen haplar o eksene uymuyor, hepsi aynı boyda görünüp anlamsız
        bir sütuna dönüşüyordu.
      */}
      <div className="flex flex-col items-center gap-[9px] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-[10px] lg:items-start lg:justify-start">
        {degerler.map((d) => (
          <span
            key={d.ad}
            className="inline-flex items-center gap-[10px] rounded-full border border-white/14 bg-white/[0.06] py-[10px] pr-[18px] pl-[11px] text-[14.5px] leading-none font-semibold text-white/90"
          >
            <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-brand/30 text-[#BDD0FF]">
              <Icon name={d.ikon} size={14} />
            </span>
            {d.ad}
          </span>
        ))}
      </div>

      {/*
        Eylem bloğu YALNIZCA dar ekranda.

        Geniş ekranda sağdaki kutu hero ile aynı hizada, ekranın ilk görünen
        yarısında duruyor ve aynı düğmeyi zaten taşıyor: iki "Eğitim Planı
        Oluştur" yan yana görünüyordu. Mobilde yan kutu olmadığı için blok
        orada tek eylem olarak kalıyor.

        Ayrışma bilinçli: üstteki boşluk ve ince ayraç çizgisi olmasa düğme
        beşinci bir hap gibi okunur, tıklanabilir olduğu kaybolurdu.

        WhatsApp'a doğrudan değil, ölçülen uçtan gidiyor (/git/whatsapp):
        tıklama kaydı yazılıyor, mesaja referans kodu gömülüyor ve Meta'ya
        Contact olayı düşüyor. Gerekçesi app/git/whatsapp/route.ts içinde.
      */}
      <div className="mt-8 border-t border-white/10 pt-8 lg:hidden">
        {/*
          Düğme mobilde tam genişlikte: dar ekranda sola yaslanmış bir düğme
          "yan bilgi" gibi okunuyordu, oysa sayfanın tek eylemi bu.
        */}
        <Link
          href={olculenWhatsapp("egitim-hero")}
          className="nabiz group flex h-14 w-full items-center justify-center gap-[11px] rounded-[14px] bg-brand px-8 text-[16.5px] font-semibold text-white shadow-[0_16px_40px_rgba(28,86,243,0.45)] transition-[background-color,box-shadow] duration-200 hover:bg-white hover:text-ink hover:shadow-[0_16px_44px_rgba(255,255,255,0.22)] sm:w-auto"
        >
          <Icon name="whatsapp" size={19} />
          Eğitim Planı Oluştur
          <span className="transition-transform duration-200 group-hover:translate-x-[3px]">→</span>
        </Link>

        {/*
          İkincil yol: grup ve kurumsal talep.

          Kutusuz, çerçevesiz, düğmeden küçük — bilerek. Bir düğme daha
          koymak iki eylemi eşitler ve asıl istenen tıklamayı zayıflatırdı;
          hiç koymamak ise böyle bir imkânın varlığını gizliyordu.

          Yalnızca dar ekranda: geniş ekranda aynı talep sağdaki kutuda kendi
          düğmesiyle duruyor, ikisi birden görünürse tekrar oluyor.
        */}
        <Link
          href="/iletisim?konu=kurumsal"
          className="group/kurumsal mt-5 flex items-center justify-center gap-[7px] text-[14.5px] font-medium text-white/70 transition-colors hover:text-white lg:hidden"
        >
          <Icon name="users" size={15} />
          Grup eğitimi &amp; kurumsal talep oluştur
          <span className="transition-transform duration-200 group-hover/kurumsal:translate-x-[3px]">→</span>
        </Link>
      </div>
    </div>
  );
}
