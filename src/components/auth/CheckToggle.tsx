import { Icon } from "@/components/Icon";

/**
 * Onay kutusu. Tik işareti metin olarak "✓" basılıyordu; yazı tipine göre
 * boyutu ve hizası değişip kutunun içinde kayıyordu.
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
    <button
      type="button"
      onClick={onToggle}
      className={`flex gap-[11px] text-left font-sans text-[#3A3F4F] ${align === "start" ? "items-start" : "items-center"}`}
    >
      <span
        className={`flex h-[19px] w-[19px] flex-none items-center justify-center rounded-[6px] border text-white transition-colors ${align === "start" ? "mt-[1px]" : ""}`}
        style={{
          background: checked ? "#1C56F3" : "#FFFFFF",
          borderColor: checked ? "#1C56F3" : "rgba(10,13,24,0.2)",
        }}
      >
        {checked && <Icon name="check" size={12} strokeWidth={3} />}
      </span>
      <span className="text-sm">{children}</span>
    </button>
  );
}
