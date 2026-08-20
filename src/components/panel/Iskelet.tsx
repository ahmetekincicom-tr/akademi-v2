/**
 * Yükleme iskeletinin yapı taşları.
 *
 * Sayfa gelene kadar beyaz ekran yerine gelecek içeriğin kaba hatları
 * duruyor. Amaç süsleme değil: boş bir ekran "bir şey oldu mu?" sorusunu
 * doğuruyor, iskelet ise "geliyor, şuraya gelecek" diyor. Bekleme süresi
 * aynı kalsa bile kısa hissediliyor.
 *
 * İki kural bu dosyanın tamamını açıklıyor:
 *
 *  1. İskelet, YERİNİ ALACAĞI ŞEYLE aynı ölçüde olmalı. Yaklaşık bir
 *     yerleşim, içerik gelince sayfanın zıplamasına yol açıyor — bu,
 *     beyaz ekrandan daha rahatsız edici çünkü göz bir şeyi okumaya
 *     başlamışken kayıyor.
 *
 *  2. İskelet metin taklidi yapmaz, YAPI taklidi yapar. Sahte satırlar
 *     gerçek başlık uzunluklarını taklit etmeye çalıştığında yalan
 *     söylemiş oluyor; değişken genişlikler yalnızca "burada bir satır
 *     var" demek için.
 *
 * Ekran okuyucular için tamamı gizli: aria-hidden ve sayfa seviyesinde
 * "yükleniyor" duyurusu. Sahte kutuları tek tek okutmanın kimseye faydası
 * yok.
 */

/** Tek bir gri kutu. Ölçüler çağıran yerden geliyor. */
export function Kutu({
  className = "",
  koyu,
  style,
}: {
  className?: string;
  koyu?: boolean;
  /** Yüzdeli genişlik gibi, sınıfla ifade edilemeyen ölçüler için. */
  style?: React.CSSProperties;
}) {
  return <div aria-hidden style={style} className={`iskelet ${koyu ? "iskelet-koyu" : ""} ${className}`} />;
}

/** Kart başlığı: simge kutusu + iki satır. */
export function BaslikIskeleti({ simge = true }: { simge?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {simge && <Kutu className="h-8 w-8 flex-none rounded-[10px]" />}
      <div className="min-w-0 flex-1">
        <Kutu className="h-[15px] w-[140px]" />
        <Kutu className="mt-[7px] h-[11px] w-[210px] max-w-full" />
      </div>
    </div>
  );
}

/**
 * Genel bakıştaki özet kutusu. OzetKarti ile aynı ölçüler:
 * p-5, 36px simge, etiket, büyük değer, alt satır.
 */
export function OzetKartiIskeleti() {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <Kutu className="h-9 w-9 rounded-[11px]" />
      <Kutu className="mt-[14px] h-[10px] w-[86px]" />
      <Kutu className="mt-[8px] h-[26px] w-[64px] rounded-[6px]" />
      <Kutu className="mt-[9px] h-[12px] w-[110px]" />
    </div>
  );
}

/** Başlıklı kart + n satır. Panelin çoğu sayfası bu şekle oturuyor. */
export function ListeKartiIskeleti({ satir = 3, simge = true }: { satir?: number; simge?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
        <BaslikIskeleti simge={simge} />
      </div>
      {Array.from({ length: satir }, (_, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/7 px-5 py-4 last:border-b-0 sm:px-6"
        >
          <div className="min-w-0 grow basis-[220px]">
            {/* Genişlikler kasten farklı: eşit uzunlukta satırlar tablo gibi
                duruyor ve gelen içerik metin olduğunda uyumsuz düşüyor. */}
            <Kutu className="h-[14px]" style={{ width: `${72 - i * 9}%` }} />
            <Kutu className="mt-[7px] h-[11px]" style={{ width: `${46 - i * 6}%` }} />
          </div>
          <Kutu className="h-[22px] w-[70px] flex-none rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Sayfa başlığı: h1 ve altındaki açıklama.
 *
 * Panel sayfalarının hepsi bu ikiliyle açılıyor ve ölçüleri sabit; iskelet
 * de sabit çünkü buradaki yükseklik farkı doğrudan zıplama demek.
 */
export function SayfaBasligiIskeleti() {
  return (
    <div>
      <Kutu className="h-[30px] w-[230px] max-w-[70%] rounded-[9px]" />
      <Kutu className="mt-[14px] h-[14px] w-[330px] max-w-full" />
    </div>
  );
}
