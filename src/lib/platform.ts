/** Toplantı bağlantısından platform adı; tanınmıyorsa "Çevrim içi". */
export function platformAdi(link: string): string {
  try {
    const host = new URL(link).hostname;
    if (host.includes("meet.google")) return "Google Meet";
    if (host.includes("zoom")) return "Zoom";
    if (host.includes("teams")) return "Microsoft Teams";
  } catch {}
  return "Çevrim içi";
}
