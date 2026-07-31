import { Fragment } from "react";

/**
 * Minimal Markdown-ish renderer for legal documents. They only ever need
 * headings, lists, and paragraphs, and the text is pasted by an admin — so it
 * is rendered as plain React elements rather than dangerouslySetInnerHTML,
 * which keeps pasted HTML from executing.
 *
 *   # / ## / ###  → başlık
 *   - veya •      → madde
 *   1. 2. 3.      → numaralı madde
 *   boş satır     → paragraf ayracı
 */

type Blok =
  | { tip: "baslik"; seviye: 2 | 3; metin: string }
  | { tip: "liste"; sirali: boolean; maddeler: string[] }
  | { tip: "paragraf"; metin: string };

const MADDE = /^\s*([-*•]|\d+[.)])\s+/;

function ayristir(icerik: string): Blok[] {
  const satirlar = icerik.replace(/\r\n/g, "\n").split("\n");
  const bloklar: Blok[] = [];

  let paragraf: string[] = [];
  let liste: string[] | null = null;
  let listeSirali = false;

  const paragrafiKapat = () => {
    if (paragraf.length) {
      bloklar.push({ tip: "paragraf", metin: paragraf.join(" ").trim() });
      paragraf = [];
    }
  };
  const listeyiKapat = () => {
    if (liste?.length) bloklar.push({ tip: "liste", sirali: listeSirali, maddeler: liste });
    liste = null;
  };

  for (const ham of satirlar) {
    const satir = ham.trim();

    if (!satir) {
      paragrafiKapat();
      listeyiKapat();
      continue;
    }

    const basligiEslesme = satir.match(/^(#{1,6})\s+(.*)$/);
    if (basligiEslesme) {
      paragrafiKapat();
      listeyiKapat();
      bloklar.push({
        tip: "baslik",
        seviye: basligiEslesme[1].length <= 2 ? 2 : 3,
        metin: basligiEslesme[2].trim(),
      });
      continue;
    }

    if (MADDE.test(satir)) {
      paragrafiKapat();
      const sirali = /^\s*\d/.test(satir);
      if (!liste || sirali !== listeSirali) {
        listeyiKapat();
        liste = [];
        listeSirali = sirali;
      }
      liste.push(satir.replace(MADDE, "").trim());
      continue;
    }

    // MADDE 5 / 5.1 gibi kısa, cümle olmayan satırları da başlık say.
    if (/^(MADDE|Madde)\s+\d+/.test(satir) && satir.length < 90) {
      paragrafiKapat();
      listeyiKapat();
      bloklar.push({ tip: "baslik", seviye: 3, metin: satir });
      continue;
    }

    listeyiKapat();
    paragraf.push(satir);
  }

  paragrafiKapat();
  listeyiKapat();
  return bloklar;
}

export function YasalIcerik({ icerik }: { icerik: string }) {
  const bloklar = ayristir(icerik);

  return (
    <div className="flex flex-col gap-[18px]">
      {bloklar.map((b, i) => (
        <Fragment key={i}>
          {b.tip === "baslik" &&
            (b.seviye === 2 ? (
              <h2 className="mt-4 font-heading text-[22px] leading-[1.25] font-semibold tracking-[-0.025em] text-ink">
                {b.metin}
              </h2>
            ) : (
              <h3 className="mt-3 font-heading text-[17px] leading-[1.3] font-semibold tracking-[-0.02em] text-ink">
                {b.metin}
              </h3>
            ))}

          {b.tip === "paragraf" && (
            <p className="text-[15.5px] leading-[1.75] text-[#3A3F4F]">{b.metin}</p>
          )}

          {b.tip === "liste" &&
            (b.sirali ? (
              <ol className="flex list-decimal flex-col gap-[9px] pl-5 text-[15.5px] leading-[1.7] text-[#3A3F4F]">
                {b.maddeler.map((m, j) => (
                  <li key={j}>{m}</li>
                ))}
              </ol>
            ) : (
              <ul className="flex flex-col gap-[9px] text-[15.5px] leading-[1.7] text-[#3A3F4F]">
                {b.maddeler.map((m, j) => (
                  <li key={j} className="flex gap-[11px]">
                    <span className="mt-[9px] h-[5px] w-[5px] flex-none rounded-full bg-brand" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            ))}
        </Fragment>
      ))}
    </div>
  );
}
