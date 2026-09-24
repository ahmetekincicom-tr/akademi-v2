import { Icon } from "@/components/Icon";

/**
 * Onay kutusu — gerçek <input type="checkbox">, görünümü özel.
 *
 * Eskiden bir <button> idi ve içine bağlantılar konuyordu (iç içe etkileşimli
 * öğe; ekran okuyucu da "düğme" diyordu, "onay kutusu" değil). Artık kutu
 * yerleşik denetim: Boşluk tuşu, aria-checked ve form davranışı tarayıcıdan.
 * Metindeki bağlantılar kutunun dışında, etiketin içinde kalıyor.
 */
export function CheckToggle({
  checked,
  onToggle,
  children,
  align = "center",
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <label className={`flex cursor-pointer gap-[10px] text-left ${align === "start" ? "items-start" : "items-center"}`}>
      <span className={`relative flex h-[18px] w-[18px] flex-none ${align === "start" ? "mt-[2px]" : ""}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-[#52525b] bg-[#111114] transition-colors checked:border-brand checked:bg-brand"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden items-center justify-center text-white peer-checked:flex"
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </span>
      </span>
      <span className="text-[13px] leading-[1.55] text-[#a1a1aa]">{children}</span>
    </label>
  );
}
