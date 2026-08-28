"use client";

import { Icon } from "@/components/Icon";
import { SECILEBILIR_IKONLAR, type IkonluSatir } from "@/lib/courses";

/**
 * Metin + ikon satırlarından oluşan liste düzenleyicisi.
 *
 * Hem hero'daki haplar hem yan kutudaki program kapsamı aynı biçimde: bir
 * cümle ve başında bir ikon. İki ayrı düzenleyici yazmak, birinde yapılan
 * düzeltmenin diğerinde unutulması demekti.
 *
 * İkon seçimi metin kutusu değil açılır liste: elle yazılan bir ikon adı
 * yanlış olduğunda sayfada sessizce onay işaretine düşerdi ve yazan kişi
 * neden öyle olduğunu anlayamazdı.
 */
export function IkonluSatirlar({
  satirlar,
  degisti,
  ekleEtiketi,
  bosMetin,
  yerTutucu,
}: {
  satirlar: IkonluSatir[];
  degisti: (yeni: IkonluSatir[]) => void;
  ekleEtiketi: string;
  bosMetin: string;
  yerTutucu: string;
}) {
  const ekle = () => degisti(satirlar.concat({ ad: "", ikon: "check" }));
  const sil = (i: number) => degisti(satirlar.filter((_, j) => j !== i));
  const yaz = (i: number, alan: keyof IkonluSatir, v: string) =>
    degisti(satirlar.map((s, j) => (j === i ? { ...s, [alan]: v } : s)));
  // Sıra sayfada göründüğü sıra.
  const tasi = (i: number, yon: -1 | 1) => {
    const hedef = i + yon;
    if (hedef < 0 || hedef >= satirlar.length) return;
    const kopya = satirlar.slice();
    [kopya[i], kopya[hedef]] = [kopya[hedef], kopya[i]];
    degisti(kopya);
  };

  return (
    <div className="flex flex-col gap-[10px]">
      {satirlar.map((s, i) => (
        <div key={i} className="flex items-center gap-[9px]">
          {/* Seçilen ikon kutunun solunda basılıyor: adı okumak yerine
              görmek, listeyi taramayı hızlandırıyor. */}
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] bg-brand/10 text-brand">
            <Icon name={s.ikon} size={17} />
          </span>
          <select
            value={s.ikon}
            onChange={(e) => yaz(i, "ikon", e.target.value)}
            aria-label="İkon"
            className="h-[38px] w-[128px] flex-none rounded-[9px] border border-ink/13 bg-white px-2 text-[13px] text-ink outline-none focus:border-brand"
          >
            {SECILEBILIR_IKONLAR.map((o) => (
              <option key={o.ikon} value={o.ikon}>
                {o.etiket}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={s.ad}
            onChange={(e) => yaz(i, "ad", e.target.value)}
            placeholder={yerTutucu}
            className="h-[38px] min-w-0 flex-1 rounded-[9px] border border-ink/13 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]"
          />
          <button
            type="button"
            onClick={() => tasi(i, -1)}
            disabled={i === 0}
            aria-label="Yukarı taşı"
            className="flex h-[38px] w-9 flex-none items-center justify-center rounded-[9px] border border-ink/13 bg-white text-[13px] text-[#656B7A] transition hover:border-brand hover:text-brand disabled:opacity-35 disabled:hover:border-ink/13 disabled:hover:text-[#656B7A]"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => tasi(i, 1)}
            disabled={i === satirlar.length - 1}
            aria-label="Aşağı taşı"
            className="flex h-[38px] w-9 flex-none items-center justify-center rounded-[9px] border border-ink/13 bg-white text-[13px] text-[#656B7A] transition hover:border-brand hover:text-brand disabled:opacity-35 disabled:hover:border-ink/13 disabled:hover:text-[#656B7A]"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => sil(i)}
            aria-label="Satırı sil"
            className="flex h-[38px] w-9 flex-none items-center justify-center rounded-[9px] border border-ink/13 bg-white text-[#656B7A] transition hover:border-danger/45 hover:text-danger"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}

      {satirlar.length === 0 && <p className="text-[13px] leading-[1.6] text-[#656B7A]">{bosMetin}</p>}

      <button
        type="button"
        onClick={ekle}
        className="inline-flex h-[36px] w-fit items-center gap-[6px] rounded-[9px] border border-brand/40 bg-brand/[0.07] px-[14px] text-[13px] font-semibold text-brand transition hover:bg-brand hover:text-white"
      >
        <Icon name="plus" size={13} />
        {ekleEtiketi}
      </button>
    </div>
  );
}
