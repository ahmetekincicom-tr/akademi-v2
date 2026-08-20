import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { IletisimFormu } from "@/components/site/IletisimFormu";
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

// href olmayan kanallar tıklanabilir görünmesin diye link yerine kart olarak çizilir.
const kanallar: { baslik: string; deger: string; href?: string }[] = [
  {
    baslik: "WhatsApp",
    deger: WHATSAPP_NUMARALAR[0].gosterim,
    href: olculenWhatsapp("iletisim"),
  },
  {
    baslik: "WhatsApp (2. hat)",
    deger: WHATSAPP_NUMARALAR[1].gosterim,
    href: olculenWhatsapp("iletisim", 1),
  },
  { baslik: "Instagram", deger: INSTAGRAM_KULLANICI, href: INSTAGRAM_URL },
  { baslik: "E-posta", deger: EPOSTA, href: `mailto:${EPOSTA}` },
  { baslik: "Ofis", deger: OFIS_ADRESI },
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
          Form doldurun ya da doğrudan WhatsApp&apos;tan yazın — genelde aynı gün içinde dönüş yapıyoruz.
        </p>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pb-24">
        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-8">
            <IletisimFormu />
          </div>

          <div className="flex flex-col gap-4">
            {kanallar.map((k) => {
              const icerik = (
                <>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-brand uppercase">{k.baslik}</span>
                  <span className="text-[15.5px] font-semibold">{k.deger}</span>
                </>
              );

              return k.href ? (
                <a
                  key={k.baslik}
                  href={k.href}
                  className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-brand/45"
                >
                  {icerik}
                </a>
              ) : (
                <div key={k.baslik} className="flex flex-col gap-1 rounded-2xl border border-ink/10 bg-white p-5">
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
