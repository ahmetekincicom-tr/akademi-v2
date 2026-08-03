import { TR_ZAMAN } from "@/lib/zaman";

export const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const kisaTarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
});

export const saatBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function para(tutar: number) {
  return paraBicimi.format(tutar);
}

export function baytBoyut(bayt: number | null) {
  if (!bayt) return "—";
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / (1024 * 1024)).toFixed(1)} MB`;
}

export const odemeDurumEtiket: Record<string, string> = {
  odendi: "Ödendi",
  bekliyor: "Onay bekliyor",
  iade: "İade edildi",
};

export const talepDurumEtiket: Record<string, string> = {
  acik: "Açık",
  yanitlandi: "Yanıtlandı",
  kapandi: "Kapandı",
};

export const seansDurumEtiket: Record<string, string> = {
  planlandi: "Planlandı",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};
