export function durumStil(d: string): { bg: string; renk: string } {
  if (d === "Aktif" || d === "Ödendi" || d === "Hazır" || d === "Bağlı" || d === "Yayında") {
    return { bg: "rgba(28,86,243,0.12)", renk: "#1C56F3" };
  }
  if (
    d === "Onay bekliyor" ||
    d === "Davet bekliyor" ||
    d === "Açık" ||
    d === "İnceleniyor" ||
    d === "İşleniyor" ||
    d === "Eksik" ||
    d === "Taslak"
  ) {
    return { bg: "rgba(201,138,27,0.14)", renk: "#A5711A" };
  }
  if (d === "İade edildi" || d === "Hata" || d === "Bağlı değil") {
    return { bg: "rgba(217,60,60,0.12)", renk: "#C13333" };
  }
  if (d === "Tamamlandı") {
    return { bg: "rgba(24,140,90,0.13)", renk: "#157A4E" };
  }
  return { bg: "rgba(10,13,24,0.07)", renk: "#5C6273" };
}

export function initials(isim: string): string {
  return isim
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2);
}

export function StatusBadge({ durum }: { durum: string }) {
  const st = durumStil(durum);
  return (
    <span
      className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
      style={{ background: st.bg, color: st.renk }}
    >
      {durum}
    </span>
  );
}
