/**
 * Yüzdeyi halka olarak gösterir.
 *
 * Sayının yanında bir de halka olmasının sebebi süs değil: "%38" okunması
 * gereken bir bilgi, halka bakılır bakılmaz anlaşılan bir bilgi. Panelin
 * girişinde göz önce şekli görüyor.
 *
 * SVG ve tek parça: JavaScript yok, sunucuda çizilip geliyor. Halkanın
 * dolumu stroke-dasharray ile — conic-gradient daha kısa yazılırdı ama
 * kenarları tırtıklı çıkıyor ve iOS Safari'de yuvarlak uç veremiyor.
 */
export function IlerlemeHalkasi({
  yuzde,
  boyut = 96,
  kalinlik = 8,
  renk = "#1C56F3",
  zemin = "rgba(28,86,243,0.14)",
  children,
}: {
  yuzde: number;
  boyut?: number;
  kalinlik?: number;
  renk?: string;
  zemin?: string;
  /** Halkanın ortasına yazılan şey; verilmezse yüzde yazılıyor. */
  children?: React.ReactNode;
}) {
  const guvenli = Math.min(100, Math.max(0, Math.round(yuzde)));
  const r = (boyut - kalinlik) / 2;
  const cevre = 2 * Math.PI * r;
  const dolu = (guvenli / 100) * cevre;

  return (
    <div className="relative flex-none" style={{ width: boyut, height: boyut }}>
      {/* -90 derece: dolum saat 12'den başlasın. Varsayılanı saat 3. */}
      <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`} className="-rotate-90">
        <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" stroke={zemin} strokeWidth={kalinlik} />
        <circle
          cx={boyut / 2}
          cy={boyut / 2}
          r={r}
          fill="none"
          stroke={renk}
          strokeWidth={kalinlik}
          strokeLinecap="round"
          strokeDasharray={`${dolu} ${cevre - dolu}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <span className="font-heading text-[19px] leading-none font-semibold tracking-[-0.03em] text-ink">
            {guvenli}
            <span className="text-[12px] font-medium text-[#656B7A]">%</span>
          </span>
        )}
      </div>
    </div>
  );
}
