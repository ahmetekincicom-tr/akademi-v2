export function SectionKicker({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "light" }) {
  return (
    <div
      className="flex items-center gap-[10px] font-mono text-[11px] tracking-[0.16em] uppercase"
      style={{ color: tone === "light" ? "#7FA0FF" : "#1C56F3" }}
    >
      <span className="h-px w-[22px] bg-brand" />
      {children}
    </div>
  );
}
