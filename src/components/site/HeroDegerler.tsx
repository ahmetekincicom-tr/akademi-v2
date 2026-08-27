import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { olculenWhatsapp } from "@/lib/iletisim";

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
 * Dört başlık programa göre değişmiyor çünkü akademinin çalışma biçimini
 * anlatıyorlar, tek bir eğitimi değil. Programa özel bir gün gelirse
 * doğru yer veritabanı olur; bugün orada tutmak, hiç değişmeyen üç satırı
 * her eğitim için yeniden doldurtmak demekti.
 */

const DEGERLER: { ad: string; ikon: IconName }[] = [
  { ad: "Birebir & Kişiye Özel", ikon: "user" },
  { ad: "%100 Uygulamalı", ikon: "sparkle" },
  { ad: "Seviyenize Özel İlerleme", ikon: "sliders" },
  { ad: "Ömür Boyu Ücretsiz Destek", ikon: "message" },
];

export function HeroDegerler() {
  return (
    <div className="mt-9">
      {/*
        Dar ekranda TEK sütun, geniş ekranda sarmalanan satır.

        Serbest sarmalama bırakıldığında telefonda 2-1-1 gibi düzensiz bir
        merdiven oluşuyordu: etiketler çok farklı uzunlukta ("%100 Uygulamalı"
        ile "Ömür Boyu Ücretsiz Destek" arasında iki kat fark var) ve iki
        sütuna tek satır hâlinde sığmıyorlar.

        Kısaltmak yerine tek sütun seçildi: hap içinde satır kırmak, yuvarlak
        kenarlı bir öğeyi kart gibi gösteriyor. Tam genişlikte tek sütun hem
        her zaman hizalı hem de alttaki tam genişlikteki düğmeyle aynı ritmi
        tutturuyor.
      */}
      <div className="flex flex-col gap-[9px] sm:flex-row sm:flex-wrap sm:gap-[10px]">
        {DEGERLER.map((d) => (
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
        Eylem, haplardan AYRIŞIYOR: üstteki boşluk ve ince ayraç çizgisi
        bilinçli. Hemen altına yapıştırılsaydı dördüncü bir hap gibi okunur
        ve tıklanabilir olduğu kaybolurdu.

        WhatsApp'a doğrudan değil, ölçülen uçtan gidiyor (/git/whatsapp):
        tıklama kaydı yazılıyor, mesaja referans kodu gömülüyor ve Meta'ya
        Contact olayı düşüyor. Gerekçesi app/git/whatsapp/route.ts içinde.
      */}
      <div className="mt-8 border-t border-white/10 pt-8">
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
      </div>
    </div>
  );
}
