import Link from "next/link";
import { CALISMA_MODELI, CALISMA_TIPI, SEVIYE, lokasyonMetni, suresiDoldu, type Ilan } from "@/lib/firsat";
import { Icon } from "@/components/Icon";
import { Etiket, SirketLogosu, SonBasvuruEtiketi, tarihMetni } from "@/components/firsat/IlanOrtak";
import { BasvurDugmesi, GoruntulenmeKaydi, KaydetDugmesi } from "@/components/firsat/IlanEylemleri";
import { OnizlemeUyarisi } from "@/components/firsat/OnizlemeUyarisi";
import { TR_ZAMAN } from "@/lib/zaman";

const yayinBicimi = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "numeric", month: "long", year: "numeric" });

function Madde({ baslik, maddeler }: { baslik: string; maddeler: string[] }) {
  if (!maddeler.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">{baslik}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {maddeler.map((m, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-[1.65] text-[#2B303D]">
            <span className="mt-[10px] h-[6px] w-[6px] flex-none rounded-full bg-brand/70" aria-hidden />
            <span>{m}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** İlan detayı (öğrenci). Sayfa veriyi ve erişimi çözüyor; burası yalnız çizim. */
export function IlanDetay({
  ilan,
  kayitli,
  bugun,
  onizleme,
}: {
  ilan: Ilan;
  kayitli: boolean;
  bugun: string;
  onizleme: boolean;
}) {
  const kapali = suresiDoldu(ilan, bugun);

  const bilgiler: { etiket: string; deger: string }[] = [
    { etiket: "Çalışma modeli", deger: CALISMA_MODELI[ilan.calismaModeli] },
    { etiket: "Lokasyon", deger: ilan.sehir ?? "Konumdan bağımsız" },
    { etiket: "Çalışma tipi", deger: CALISMA_TIPI[ilan.calismaTipi] },
    { etiket: "Seviye", deger: SEVIYE[ilan.seviye] },
    ...(ilan.ucret ? [{ etiket: "Ücret", deger: ilan.ucret }] : []),
    ...(ilan.yayinTarihi ? [{ etiket: "Yayın tarihi", deger: yayinBicimi.format(new Date(ilan.yayinTarihi)) }] : []),
    { etiket: "Son başvuru", deger: ilan.sonBasvuru ? tarihMetni(ilan.sonBasvuru, true) : "Belirtilmedi" },
  ];

  return (
    <main className="p-4 pb-32 sm:p-[34px] lg:pb-14">
      {onizleme && <OnizlemeUyarisi />}
      <GoruntulenmeKaydi ilanId={ilan.id} />

      <Link
        href="/panel/firsatlar"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C6273] hover:text-brand"
      >
        <Icon name="arrowLeft" size={14} />
        Tüm fırsatlar
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <article className="min-w-0">
          <header className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <SirketLogosu ilan={ilan} boyut={60} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {ilan.oneCikan && !kapali && <Etiket vurgulu>Öne çıkan</Etiket>}
                  <Etiket>{ilan.kategori}</Etiket>
                </div>
                <h1 className="mt-2 font-heading text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[28px]">
                  {ilan.pozisyon}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[15px] text-[#3A3F4F]">
                  <span className="font-medium">{ilan.sirketAdi}</span>
                  {ilan.sirketWeb && (
                    <a
                      href={ilan.sirketWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline"
                    >
                      Web sitesi <Icon name="external" size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/7 pt-4 text-[13.5px] text-[#5C6273]">
              <span className="inline-flex items-center gap-[6px]">
                <Icon name="pin" size={14} />
                {lokasyonMetni(ilan)}
              </span>
              <span className="inline-flex items-center gap-[6px]">
                <Icon name="briefcase" size={14} />
                {CALISMA_TIPI[ilan.calismaTipi]}
              </span>
              <span>{SEVIYE[ilan.seviye]}</span>
              <SonBasvuruEtiketi ilan={ilan} bugun={bugun} />
            </div>
          </header>

          {kapali && (
            <div className="mt-4 rounded-[12px] border border-ink/10 bg-mist/70 px-4 py-3 text-[14px] text-[#3A3F4F]">
              <strong className="font-semibold">İlan süresi doldu.</strong> Bu ilana artık başvuru alınmıyor.
            </div>
          )}

          <div className="px-1 sm:px-2">
            {ilan.aciklama && (
              <section className="mt-8">
                <h2 className="font-heading text-[18px] font-semibold tracking-[-0.02em]">Pozisyon hakkında</h2>
                <p className="mt-3 text-[15px] leading-[1.75] whitespace-pre-line text-[#2B303D]">{ilan.aciklama}</p>
              </section>
            )}
            <Madde baslik="Sorumluluklar" maddeler={ilan.sorumluluklar} />
            <Madde baslik="Aranan özellikler" maddeler={ilan.arananOzellikler} />
            <Madde baslik="Tercihen" maddeler={ilan.tercihenOzellikler} />
          </div>
        </article>

        {/* Özet + başvuru (masaüstünde sağda yapışık) */}
        <aside className="lg:sticky lg:top-[calc(var(--baslik-h,64px)+20px)] lg:self-start">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <dl className="flex flex-col divide-y divide-ink/7">
              {bilgiler.map((b) => (
                <div key={b.etiket} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0">
                  <dt className="text-[13px] text-[#656B7A]">{b.etiket}</dt>
                  <dd className="text-right text-[14px] font-medium text-ink">{b.deger}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 hidden gap-2 lg:flex">
              <div className="flex-1">
                <BasvurDugmesi ilan={ilan} kapali={kapali} tamGenislik />
              </div>
              <KaydetDugmesi ilanId={ilan.id} kayitli={kayitli} />
            </div>
            {!kapali && (
              <p className="mt-3 hidden text-[12px] leading-[1.5] text-[#8A90A0] lg:block">
                {ilan.basvuruTipi === "eposta"
                  ? "Başvuru e-postası şirkete doğrudan gider; özgeçmişini eklemeyi unutma."
                  : "Başvuru şirketin kendi sayfasında yapılır."}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Mobil: altta sabit başvuru çubuğu (WhatsApp düğmesinin üstünde, z-45) */}
      <div className="fixed inset-x-0 bottom-0 z-[45] flex gap-2 border-t border-ink/8 bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex-1">
          <BasvurDugmesi ilan={ilan} kapali={kapali} tamGenislik />
        </div>
        <KaydetDugmesi ilanId={ilan.id} kayitli={kayitli} genis />
      </div>
    </main>
  );
}
