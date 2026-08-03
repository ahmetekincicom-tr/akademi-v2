/**
 * Saat dilimi. Eğitmen de katılımcılar da Türkiye'de; takvimdeki her saat
 * Türkiye saati demek.
 *
 * Bunu açıkça yazmak zorundayız çünkü kod iki ayrı yerde çalışıyor: Vercel
 * sunucuları UTC, tarayıcı ise kullanıcının cihaz saatinde. Belirtilmezse
 * aynı kayıt sunucuda 15:00, telefonda 18:00 görünüyor — hem yanlış, hem de
 * sunucu/istemci render'ı çeliştiği için hidrasyon uyuşmazlığı.
 */
export const TR_ZAMAN = "Europe/Istanbul";

const PARCA = new Intl.DateTimeFormat("en-US", {
  timeZone: TR_ZAMAN,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Verilen anda Türkiye'nin UTC'ye göre farkı, dakika cinsinden. */
function ofsetDk(an: Date): number {
  const p = Object.fromEntries(PARCA.formatToParts(an).map((x) => [x.type, x.value]));
  // hour12:false bazı ortamlarda gece yarısını "24" veriyor.
  const saat = Number(p.hour) % 24;
  const trAn = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), saat, Number(p.minute), Number(p.second));
  // Biçimlendirici saniyeye kadar veriyor; girdideki milisaniye farkı ofsete
  // sızmasın diye tam dakikaya yuvarlanıyor. Saat dilimi farkları zaten
  // dakika katlarında.
  return Math.round((trAn - an.getTime()) / 60000);
}

/**
 * Formdaki "2026-08-03T15:00" değerini UTC ISO'ya çevirir.
 *
 * `new Date("2026-08-03T15:00")` bu işi YAPMAZ: saat dilimi yazmayan bir
 * metni çalıştığı makinenin yerel saati sayar. Sunucu UTC olduğu için 15:00
 * doğrudan 15:00Z olarak kaydediliyor ve ekranda 18:00 görünüyordu.
 */
export function trSaatiniUtcYap(yerel: string): string | null {
  const e = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(yerel);
  if (!e) return null;

  const [, y, ay, g, s, dk] = e;
  // Önce "sanki UTC'ymiş gibi" al, sonra o andaki gerçek farkı geri çıkar.
  // Türkiye 2016'dan beri sabit UTC+3, yaz saati uygulaması yok; tek geçiş
  // yeterli. Farkı sabit 180 yazmak yerine hesaplıyoruz ki kural değişirse
  // kod kendiliğinden doğru kalsın.
  const varsayim = Date.UTC(Number(y), Number(ay) - 1, Number(g), Number(s), Number(dk));
  const gercek = varsayim - ofsetDk(new Date(varsayim)) * 60000;
  return new Date(gercek).toISOString();
}

/** Kayıttaki UTC anı, datetime-local kutusunun istediği Türkiye saatine çevirir. */
export function utcyiTrInputYap(iso: string | null): string {
  if (!iso) return "";
  const p = Object.fromEntries(PARCA.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const saat = String(Number(p.hour) % 24).padStart(2, "0");
  return `${p.year}-${p.month}-${p.day}T${saat}:${p.minute}`;
}
