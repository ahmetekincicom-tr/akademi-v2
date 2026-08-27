import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { IletisimFormu } from "@/components/site/IletisimFormu";
import { Icon, type IconName } from "@/components/Icon";
import {
  WHATSAPP_NUMARALAR,
  EPOSTA,
  INSTAGRAM_KULLANICI,
  INSTAGRAM_URL,
  OFIS_ADRESI,
  olculenWhatsapp,
} from "@/lib/iletisim";
import { sayfaMeta } from "@/lib/seo";

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  baslik: "İletişim",
  aciklama:
    "Hangi dijital pazarlama programının size uyduğunu birlikte belirleyelim. Formu doldurun ya da WhatsApp'tan yazın; Ankara ofisi ve online görüşme seçenekleri açık.",
  yol: "/iletisim",
});
}

/*
  İletişim kanalları.

  İki numara eskiden "WhatsApp" ve "WhatsApp (2. hat)" diye duruyordu; oysa
  ikisi farklı işler: 0850 hattı WhatsApp, 0545 hattı telefonla arama. Aynı
  adla listelemek, arayan kişiyi mesaj hattına düşürüyordu.

  href olmayan kanallar tıklanabilir görünmesin diye link yerine kart olarak
  çizilir.
*/
const kanallar: { baslik: string; deger: string; ikon: IconName; href?: string; vurgu?: boolean }[] = [
  {
    baslik: "WhatsApp hattı",
    deger: WHATSAPP_NUMARALAR[0].gosterim,
    ikon: "whatsapp",
    href: olculenWhatsapp("iletisim"),
    // Tek renkli kart: en çok kullanılan kanal, listede kaybolmasın.
    vurgu: true,
  },
  {
    baslik: "Sesli görüşme hattı",
    deger: WHATSAPP_NUMARALAR[1].gosterim,
    ikon: "phone",
    href: `tel:+${WHATSAPP_NUMARALAR[1].numara}`,
  },
  { baslik: "Instagram", deger: INSTAGRAM_KULLANICI, ikon: "instagram", href: INSTAGRAM_URL },
  { baslik: "E-posta", deger: EPOSTA, ikon: "mail", href: `mailto:${EPOSTA}` },
  { baslik: "Ofis", deger: OFIS_ADRESI, ikon: "pin" },
];

export default function IletisimPage() {
  return (
    <div className="bg-white">
      <PublicHeader />

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-16 pb-14">
        <SectionKicker>İletişim</SectionKicker>
        <h1 className="mt-[18px] max-w-[620px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Hangi programın size uyduğunu konuşarak bulalım.
        </h1>
        <p className="mt-6 max-w-[540px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Konuyla ilgili detaylı görüşme yapmak için formu doldurun. Genellikle aynı gün içinde dönüş sağlanır.
        </p>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pb-24">
        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-8">
            <IletisimFormu />
          </div>

          {/*
            Kartlar formun boyuna göre esniyor (h-full + flex-1). Sabit
            yükseklikteyken sütun formdan kısa kalıyor ve sağ tarafta boşluk
            oluşuyordu; iki sütun aynı yerde bitmiyordu.
          */}
          <div className="flex h-full flex-col gap-3">
            {kanallar.map((k) => {
              const icerik = (
                <>
                  <span
                    className={`flex h-10 w-10 flex-none items-center justify-center rounded-[11px] ${
                      k.vurgu ? "bg-[#25D366] text-white" : "bg-[#F2F4FA] text-ink"
                    }`}
                  >
                    <Icon name={k.ikon} size={19} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-[3px]">
                    {/* Etiket rengi mavi değil siyah: mavi, sayfadaki tek
                        eylem olan gönder düğmesiyle yarışıyordu. */}
                    <span className="font-mono text-[10px] tracking-[0.14em] text-ink/55 uppercase">{k.baslik}</span>
                    <span className="truncate text-[15.5px] font-semibold">{k.deger}</span>
                  </span>
                </>
              );

              const ortak = "flex flex-1 items-center gap-[14px] rounded-2xl border border-ink/10 bg-white px-5 py-4";

              return k.href ? (
                <a
                  key={k.baslik}
                  href={k.href}
                  className={`${ortak} transition hover:border-ink/40 hover:shadow-[0_10px_26px_rgba(10,13,24,0.07)]`}
                >
                  {icerik}
                </a>
              ) : (
                <div key={k.baslik} className={ortak}>
                  {icerik}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
