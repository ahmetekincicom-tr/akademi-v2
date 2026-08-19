import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

/**
 * Genel bakıştaki özet kutusu.
 *
 * Önceki hâli etiket + kocaman sayı + alt yazıydı; dördü yan yana durunca
 * sayfa bir sayı tablosuna dönüyordu. Üç şey eklendi ve kutular birbirinden
 * ayrıldı: sol üstte konuyu söyleyen simge, altta duruma göre dolan ince bir
 * çubuk, ve kutunun bir yere gidiyorsa tıklanabilir olması.
 *
 * Çubuk bilerek isteğe bağlı: her sayı bir orana karşılık gelmiyor ve
 * karşılığı olmayan yerde boş bir çubuk çizmek yanlış bilgi veriyor.
 */
export function OzetKarti({
  etiket,
  deger,
  alt,
  ikon,
  yuzde,
  yol,
  vurgu,
}: {
  etiket: string;
  deger: string;
  alt: string;
  ikon: IconName;
  /** Verilirse altta ince ilerleme çubuğu çiziliyor. */
  yuzde?: number;
  /** Verilirse kutu tıklanabilir oluyor. */
  yol?: string;
  /** Dikkat çeken kutu (bekleyen ödeme gibi); kırmızı tonla çiziliyor. */
  vurgu?: boolean;
}) {
  const govde = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] transition group-hover:scale-105"
          style={
            vurgu
              ? { background: "rgba(229,72,77,0.12)", color: "#B4232A" }
              : { background: "#EEF2FC", color: "#1C56F3" }
          }
        >
          <Icon name={ikon} size={17} />
        </span>
        {yol && (
          <Icon
            name="arrowRight"
            size={15}
            className="flex-none text-[#C2C7D2] transition group-hover:translate-x-[2px] group-hover:text-brand"
          />
        )}
      </div>

      <div className="mt-[14px] font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">
        {etiket}
      </div>
      <div
        className="mt-[6px] font-heading text-[28px] leading-none font-semibold tracking-[-0.035em]"
        style={{ color: vurgu ? "#B4232A" : undefined }}
      >
        {deger}
      </div>
      <div className="mt-[7px] text-[12.5px] leading-[1.45] text-[#656B7A]">{alt}</div>

      {typeof yuzde === "number" && (
        <div className="mt-[14px] h-[5px] w-full overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${Math.min(100, Math.max(0, yuzde))}%`,
              background: vurgu ? "#E5484D" : "#1C56F3",
            }}
          />
        </div>
      )}
    </>
  );

  const sinif =
    "group flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-5 transition duration-200";

  if (!yol) return <div className={sinif}>{govde}</div>;

  return (
    <Link
      href={yol}
      className={`${sinif} hover:-translate-y-[2px] hover:border-brand/35 hover:shadow-[0_10px_28px_rgba(10,13,24,0.07)]`}
    >
      {govde}
    </Link>
  );
}
