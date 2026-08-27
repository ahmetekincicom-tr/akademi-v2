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
 * O bilgiler KAYBOLMUYOR: sağdaki kayıt kutusunda (course.kutuSatir) satır
 * satır duruyorlar. Hero'nun işi ikna etmek, künye yazmak değil.
 *
 * Üç başlık programa göre değişmiyor çünkü akademinin çalışma biçimini
 * anlatıyorlar, tek bir eğitimi değil. Programa özel bir gün gelirse
 * doğru yer veritabanı olur; bugün orada tutmak, hiç değişmeyen üç satırı
 * her eğitim için yeniden doldurtmak demekti.
 */

const DEGERLER: { ad: string; ikon: IconName }[] = [
  { ad: "Birebir & Kişiye Özel", ikon: "user" },
  { ad: "%100 Uygulamalı", ikon: "sparkle" },
  { ad: "Ömür Boyu Ücretsiz Destek", ikon: "message" },
];

export function HeroDegerler() {
  return (
    <div className="mt-9">
      <div className="flex flex-wrap gap-[10px]">
        {DEGERLER.map((d) => (
          <span
            key={d.ad}
            className="inline-flex items-center gap-[9px] rounded-full border border-white/16 bg-white/[0.07] py-[9px] pr-[16px] pl-[12px] text-[14px] leading-none font-semibold text-white/90 sm:text-[14.5px]"
          >
            <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-brand/30 text-[#BDD0FF]">
              <Icon name={d.ikon} size={13} />
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
      <div className="mt-7 border-t border-white/10 pt-7">
        <Link
          href={olculenWhatsapp("egitim-hero")}
          className="inline-flex h-13 items-center justify-center gap-[10px] rounded-[12px] bg-white px-7 text-[15.5px] font-semibold text-ink shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition hover:bg-brand hover:text-white"
        >
          <Icon name="whatsapp" size={18} />
          Eğitim Planı Oluştur
        </Link>
        <p className="mt-[10px] text-[13px] leading-[1.5] text-white/45">
          WhatsApp&apos;tan yazın, kapsamı birlikte belirleyelim.
        </p>
      </div>
    </div>
  );
}
