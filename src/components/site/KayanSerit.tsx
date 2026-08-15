/**
 * Kayan kelime şeridi.
 *
 * Liste iki kez basılıyor: animasyon %50 kaydırıp başa döndüğü için ikinci
 * kopya, birincinin bittiği yeri doldurmak zorunda. İkinci kopya ekran
 * okuyucudan gizli — aynı kelimeler iki kez okunmamalı.
 *
 * Şerit bilgi taşımıyor, ritim taşıyor: bu yüzden tamamı aria-hidden ve
 * hareketi azaltma tercihinde duruyor (globals.css).
 */
export function KayanSerit({
  kelimeler,
  tema = "koyu",
  ters = false,
  hiz = "normal",
}: {
  kelimeler: string[];
  /** koyu: siyah zemin beyaz yazı · acik: açık zemin koyu yazı · marka: mavi zemin */
  tema?: "koyu" | "acik" | "marka";
  /** Ters yön: iki şerit üst üste geldiğinde aynı yöne akmaları tekdüze duruyor. */
  ters?: boolean;
  hiz?: "normal" | "yavas";
}) {
  const stil = {
    koyu: { bg: "#0A0D18", yazi: "#FFFFFF", ayrac: "#1C56F3", kenar: "rgba(255,255,255,0.08)" },
    acik: { bg: "#F5F6FA", yazi: "#0A0D18", ayrac: "#1C56F3", kenar: "rgba(10,13,24,0.08)" },
    marka: { bg: "#1C56F3", yazi: "#FFFFFF", ayrac: "#FFFFFF", kenar: "rgba(255,255,255,0.18)" },
  }[tema];

  const sinif = [
    ters ? "kayan-serit-ters" : "kayan-serit",
    hiz === "yavas" ? "kayan-serit-yavas" : "",
    "flex w-max items-center",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-hidden
      className="overflow-hidden border-y py-[18px] select-none"
      style={{ background: stil.bg, borderColor: stil.kenar }}
    >
      <div className={sinif}>
        {[...kelimeler, ...kelimeler].map((k, i) => (
          <span key={`${k}-${i}`} className="flex flex-none items-center">
            <span
              className="font-heading text-[19px] font-semibold tracking-[-0.01em] whitespace-nowrap uppercase sm:text-[22px]"
              style={{ color: stil.yazi }}
            >
              {k}
            </span>
            {/* Ayraç dörtgeni: kelimeler arasına nokta koymak yerine markanın
                kendi geometrisi. 45 derece döndürülmüş kare. */}
            <span
              className="mx-[26px] block h-[7px] w-[7px] flex-none rotate-45 sm:mx-[34px]"
              style={{ background: stil.ayrac }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
