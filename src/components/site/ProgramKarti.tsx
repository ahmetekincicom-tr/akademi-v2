import Link from "next/link";
import { Icon } from "@/components/Icon";
import { basligiIkiSatir } from "@/lib/courses";

/**
 * Vitrin kartı: ana sayfadaki "Programlar" ile /egitimler listesi aynı kartı
 * kullanıyor.
 *
 * Önceden iki sayfada iki ayrı kopya vardı ve çoktan ayrışmışlardı — birinde
 * süre satırı ve madde listesi duruyor, diğerinde durmuyordu. Aynı şeyi iki
 * yerde güncellemek zorunda kalmak, ikisinin farklı görünmesinin sebebiydi.
 */

export type ProgramKartiVerisi = {
  slug: string;
  etiket: string;
  sure: string;
  baslik: string;
  aciklama: string;
  maddeler: string[];
  kapak: string | null;
  /** Panelden işaretleniyor; kart görselinde "YENİ" rozeti gösteriyor. */
  yeni: boolean;
};

/**
 * "Meta Ads" → "Meta Ads Eğitimini İncele", "sosyal medya" → "Sosyal Medya…".
 *
 * Türkçe yerel ayarıyla: toUpperCase() "i" harfini "I" yapıyor, oysa burada
 * "İ" gerekiyor ("içerik" → "İçerik").
 */
function baslikBicimi(metin: string) {
  return metin
    .trim()
    .split(/\s+/)
    .map((k) => k.charAt(0).toLocaleUpperCase("tr") + k.slice(1))
    .join(" ");
}

export function ProgramKarti({
  p,
  vitrin = false,
  /** Kart başlığının HTML seviyesi: liste sayfasında h2, ana sayfada h3. */
  baslikSeviyesi = "h3",
}: {
  p: ProgramKartiVerisi;
  vitrin?: boolean;
  baslikSeviyesi?: "h2" | "h3";
}) {
  const Baslik = baslikSeviyesi;
  const href = `/egitimler/${p.slug}`;
  // Aynı bölme kuralı eğitim sayfasının hero başlığında da kullanılıyor.
  const ikiSatir = basligiIkiSatir(p.baslik);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl bg-white transition hover:-translate-y-[5px] hover:border-brand/45 hover:shadow-[0_22px_46px_rgba(10,13,24,0.12)] ${
        vitrin ? "border-2 border-brand/35 shadow-[0_18px_44px_rgba(28,86,243,0.18)]" : "border border-ink/11"
      }`}
    >
      {/*
        Görsel ve başlık da detaya gidiyor: kart bir bağlantı gibi görünüyordu
        ama yalnızca alttaki düğme tıklanabiliyordu. Kartın tamamını tek bir
        <a> yapmak seçenek değil — içindeki düğme de bağlantı ve iç içe <a>
        geçersiz.
      */}
      <Link
        href={href}
        aria-label={`${p.baslik} detayına git`}
        className={`relative flex aspect-video items-end border-b border-ink/8 p-[14px] ${
          p.kapak ? "bg-cover bg-center" : "placeholder-block"
        }`}
        style={p.kapak ? { backgroundImage: `url(${p.kapak})` } : undefined}
      >
        {!p.kapak && (
          <span className="rounded-[5px] bg-white/90 px-2 py-[5px] font-mono text-[10px] text-[#656B7A]">
            program görseli 16:9
          </span>
        )}
        {/*
          İki rozet TEK BİR SATIRDA, iki ayrı mutlak konumda değil.

          Ayrı ayrı konumlandıklarında 320px genişlikte "META ADS" ile "EN ÇOK
          TERCİH EDİLEN" üst üste biniyordu; ikisini alt alta ya da alt köşeye
          almak da görselin üstündeki yer tutucu yazıyla çakışıyordu. Aynı
          satırda justify-between ile duruyorlar: kategori sabit, rozet kalan
          yere sığıyor.

          Vitrin rozeti "yeni"yi bastırıyor: iki rozet aynı anda gösterilseydi
          hangisinin okunacağı belirsiz olurdu, ikisi de aynı köşede.
        */}
        <span className="absolute inset-x-[14px] top-[14px] flex items-start justify-between gap-2">
          <span className="flex-none rounded-[6px] bg-ink px-[10px] py-[6px] font-mono text-[10px] tracking-[0.1em] text-white uppercase">
            {p.etiket}
          </span>
          {(vitrin || p.yeni) && (
            <span className="rounded-[6px] bg-brand px-[10px] py-[6px] text-right font-mono text-[10px] leading-[1.35] tracking-[0.1em] text-white uppercase shadow-[0_6px_16px_rgba(28,86,243,0.35)]">
              {vitrin ? "En çok tercih edilen" : "Yeni"}
            </span>
          )}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-[26px] pt-[26px] pb-7">
        {/*
          Süre satırı: saat bilgisi tek başına "ne kadar sürer" sorusunu
          yanıtlıyor ama biçimi söylemiyordu. Canlı ve birebir olması bu
          programların ayırt edici yanı, süreyle aynı satırda duruyor.
        */}
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-[#6B7080]">
          <Icon name="clock" size={13} className="text-brand" strokeWidth={1.8} />
          <span>{p.sure ? `${p.sure} · ` : ""}Canlı · Birebir</span>
        </div>

        {/*
          Başlık İKİ SATIRDA: ilk kelime ("Birebir") üstte, programın adı
          altında. Kırılma tarayıcıya bırakılmıyor.

          Sebep iki tane. Birincisi hiza: başlıklar farklı uzunlukta ve tek
          satıra sığan bir ad, iki satıra taşan komşusunun yanında kartın
          geri kalanını yukarı çekiyordu. İkincisi okuma sırası — "Birebir"
          üç programın da ortak özelliği, adın kendisi ikinci satırda tek
          başına duruyor.

          min-h iki satırı garanti ediyor: tek kelimelik bir program adı
          eklenirse (basligiIkiSatir null döner) kart yine hizada kalıyor.
        */}
        <Baslik className="mt-[14px] flex min-h-[54px] items-start font-heading text-[21.5px] leading-[1.22] font-semibold tracking-[-0.03em]">
          {/*
            text-ink AÇIKÇA yazılıyor: global `a { color: brand }` kuralı
            yüzünden kart başlıkları da maviydi ve yanındaki `hover:text-brand`
            hiçbir şey yapmıyordu — üç kart başlığı, madde işaretleri ve düğme
            aynı mavideyken kartta neyin bağlantı olduğu kayboluyordu.
          */}
          <Link href={href} className="text-ink transition-colors hover:text-brand">
            {ikiSatir ? (
              <>
                {ikiSatir.ilk}
                <br />
                {ikiSatir.kalan}
              </>
            ) : (
              p.baslik
            )}
          </Link>
        </Baslik>

        {/*
          Açıklama geniş ekranda EN AZ BEŞ SATIRLIK yer kaplıyor (8em = 5 ×
          1.6 satır yüksekliği).

          Metinler farklı uzunlukta ve olması gereken de bu — panelde ne
          yazıldıysa o duruyor. Ama kartlar yan yanayken dört satırlık bir
          açıklama, beş satırlık komşusunun yanında ayraç çizgisini ve madde
          listesini bir satır yukarı çekiyordu. Ölçü metinden alınıp metne
          dayatılmıyor: yer sabit, metin serbest.

          Yalnızca md ve üstünde: dar ekranda kartlar alt alta, hizalanacak
          bir komşu yok ve orada sabit yükseklik boşluk demek olurdu.
        */}
        <p className="mt-[11px] mb-[22px] text-[15px] leading-[1.6] text-[#5C6273] md:min-h-[8em]">{p.aciklama}</p>

        {/*
          Madde listesi mt-auto DEĞİL: aşağı itilen bir blok olduğunda üstündeki
          ayraç çizgisi listenin kendi yüksekliğine göre yer buluyor ve üç
          kartta üç farklı hizaya düşüyordu. Liste artık açıklamanın hemen
          altında; boşluğu emen ve dibe yapışan tek şey düğme.
        */}
        {p.maddeler.length > 0 && (
          <div className="mb-[26px] flex flex-col gap-[11px] border-t border-ink/8 pt-5">
            {p.maddeler.map((m) => (
              <div key={m} className="flex items-start gap-[10px] text-[14.5px] leading-[1.5] text-[#3A3F4F]">
                <span className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-[5px] bg-brand/12 text-brand">
                  <Icon name="check" size={11} strokeWidth={3} />
                </span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        )}

        {/*
          Düğme programın ADINI söylüyor: "Program detayını incele" üç kartta
          da aynıydı ve hangi programa gittiği ancak kartın geri kalanından
          anlaşılıyordu. Metin etiketten kuruluyor, elle yazılmıyor — panelde
          etiket değişince düğme de değişiyor.
        */}
        <Link
          href={href}
          /*
            Yükseklik SABİT DEĞİL (min-h + py): "Sosyal Medya Eğitimini
            İncele" 320px'te iki satıra düşüyor ve sabit 50px'lik kutuda
            metin dışarı taşıyordu.
          */
          className="group/dugme mt-auto flex min-h-[50px] items-center justify-center gap-[9px] rounded-[11px] bg-brand px-4 py-3 text-center text-[14.5px] font-semibold text-white shadow-[0_10px_24px_rgba(28,86,243,0.25)] transition hover:bg-ink sm:text-[15px]"
        >
          <span>{baslikBicimi(p.etiket)} Eğitimini İncele</span>
          <Icon
            name="arrowRight"
            size={16}
            className="flex-none transition-transform duration-200 group-hover/dugme:translate-x-[3px]"
          />
        </Link>
      </div>
    </div>
  );
}
