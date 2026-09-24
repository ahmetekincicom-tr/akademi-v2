import { Icon } from "@/components/Icon";

/**
 * Oturum ekranlarının durum kutusu (koyu tema).
 *
 * hata  → role="alert" (hemen okunur)
 * bilgi → role="status" (sırasını bekler)
 * Simge gerçek ikon setinden; metin rengi koyu zeminde AA kontrastlı.
 */
export function UyariKutusu({
  mesaj,
  tur = "hata",
  id,
}: {
  mesaj: string;
  tur?: "hata" | "bilgi";
  /** Alanlar aria-describedby ile bu kutuya bağlanabilsin. */
  id?: string;
}) {
  const hata = tur === "hata";
  return (
    <div
      id={id}
      role={hata ? "alert" : "status"}
      className={`flex items-start gap-[10px] rounded-[10px] border px-[13px] py-[11px] ${
        hata ? "border-[#f87171]/35 bg-[#f87171]/[0.08]" : "border-brand/45 bg-brand/[0.12]"
      }`}
    >
      <span className={`mt-[1px] flex-none ${hata ? "text-[#f87171]" : "text-[#8fb0ff]"}`} aria-hidden>
        <Icon name="alert" size={16} strokeWidth={2} />
      </span>
      <span className={`text-[13.5px] leading-[1.5] ${hata ? "text-[#fecaca]" : "text-[#dbe5ff]"}`}>{mesaj}</span>
    </div>
  );
}
