import Link from "next/link";
import { PublicHeader } from "@/components/site/PublicHeader";
import { nativeIstekMi } from "@/lib/native-sunucu";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SectionKicker } from "@/components/site/SectionKicker";
import { YasalIcerik } from "@/components/site/YasalIcerik";
import { EPOSTA } from "@/lib/iletisim";
import type { YasalSayfa } from "@/lib/yasal";
import { TR_ZAMAN } from "@/lib/zaman";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function YasalSayfaGorunumu({
  sayfa,
  digerleri,
}: {
  sayfa: YasalSayfa;
  digerleri: YasalSayfa[];
}) {
  const bosMu = !sayfa.icerik.trim();
  // Sunucuda okunuyor: istemci tarafı kontrolü hidrasyona kadar site menüsünü
  // bir an gösterirdi. Bu sayfalar zaten force-dynamic, ek maliyeti yok.
  const native = await nativeIstekMi();

  return (
    <div className="bg-white">
      {/* Yasal metinler uygulamada açılabiliyor (App Store şartı) ama site
          menüsü ve alt bilgi orada gizli: ikisi de pazarlama sayfalarına
          gezinme veriyor. */}
      {!native && <PublicHeader />}

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-16 pb-10">
        <SectionKicker>Yasal</SectionKicker>
        <h1 className="mt-[18px] max-w-[720px] font-heading text-[34px] leading-[1.1] font-semibold tracking-[-0.035em] sm:text-[42px]">
          {sayfa.baslik}
        </h1>
        {sayfa.ozet && (
          <p className="mt-5 max-w-[620px] text-[16.5px] leading-[1.62] text-[#5C6273]">{sayfa.ozet}</p>
        )}
        {sayfa.guncelleme && (
          <p className="mt-4 font-mono text-[11px] tracking-[0.08em] text-[#656B7A] uppercase">
            Son güncelleme: {tarihBicimi.format(new Date(sayfa.guncelleme))}
          </p>
        )}
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pb-24">
        <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1fr_300px]">
          <article className="rounded-2xl border border-ink/10 bg-white p-8 sm:p-10">
            {bosMu ? (
              <div className="py-6">
                <h2 className="font-heading text-xl font-semibold tracking-[-0.02em]">Bu metin henüz yayınlanmadı</h2>
                <p className="mt-3 max-w-[460px] text-[15px] leading-[1.65] text-[#5C6273]">
                  Sözleşme metnini en kısa sürede burada yayınlayacağız. Bu arada koşullar hakkında bilgi almak için
                  bize yazabilirsin.
                </p>
                <Link
                  href="/iletisim"
                  className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white transition hover:bg-ink"
                >
                  İletişime geç
                </Link>
              </div>
            ) : (
              <YasalIcerik icerik={sayfa.icerik} />
            )}
          </article>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            {digerleri.length > 0 && (
              <div className="rounded-2xl border border-ink/10 bg-mist p-6">
                <div className="font-mono text-[10px] tracking-[0.14em] text-[#656B7A] uppercase">Diğer belgeler</div>
                <div className="mt-4 flex flex-col gap-[11px]">
                  {digerleri.map((d) => (
                    <Link
                      key={d.slug}
                      href={`/${d.slug}`}
                      className="text-[14.5px] leading-[1.45] font-medium text-[#3A3F4F] transition hover:text-brand"
                    >
                      {d.baslik}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <div className="font-mono text-[10px] tracking-[0.14em] text-[#656B7A] uppercase">Soru mu var?</div>
              <p className="mt-3 text-[14px] leading-[1.6] text-[#5C6273]">
                Bu belgelerle ilgili her konuda bize ulaşabilirsin.
              </p>
              <a
                href={`mailto:${EPOSTA}`}
                className="mt-3 block text-[14px] font-semibold break-all text-brand hover:text-ink"
              >
                {EPOSTA}
              </a>
            </div>
          </aside>
        </div>
      </section>

      {!native && <PublicFooter />}
    </div>
  );
}
