export function SectionKicker({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "light" }) {
  return (
    <div
      className="font-mono text-[11px] tracking-[0.16em] uppercase"
      style={{ color: tone === "light" ? "#7FA0FF" : "#1C56F3" }}
    >
      {children}
    </div>
  );
}
