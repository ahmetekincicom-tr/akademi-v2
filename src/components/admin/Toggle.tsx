export function Toggle({
  checked,
  onToggle,
  label,
  sublabel,
  size = "md",
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  sublabel?: string;
  size?: "md" | "sm";
}) {
  const w = size === "sm" ? 36 : 38;
  const h = size === "sm" ? 21 : 22;
  const dot = size === "sm" ? 15 : 16;

  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 text-left">
      <span
        className="flex flex-none items-center rounded-full px-[3px]"
        style={{
          width: w,
          height: h,
          background: checked ? "#1C56F3" : "rgba(10,13,24,0.18)",
          justifyContent: checked ? "flex-end" : "flex-start",
        }}
      >
        <span className="rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]" style={{ width: dot, height: dot }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {sublabel && <span className="mt-[2px] block text-[12.5px] text-[#656B7A]">{sublabel}</span>}
      </span>
    </button>
  );
}
