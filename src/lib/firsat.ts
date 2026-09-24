/**
 * İş ilanları / fırsatlar — ortak tanımlar (saf modül).
 *
 * Hem sunucu (sorgu, server action doğrulaması) hem istemci (liste
 * süzgeçleri, form) kullanıyor. Veritabanındaki kısıtlarla birebir aynı
 * değer kümeleri burada; etiketler yalnız arayüz için.
 */

import { TR_ZAMAN } from "@/lib/zaman";

export type CalismaTipi = "tam_zamanli" | "yari_zamanli" | "freelance" | "staj";
export type CalismaModeli = "ofis" | "hibrit" | "uzaktan";
export type Seviye = "giris" | "orta" | "kidemli" | "yonetici" | "fark_etmez";
export type IlanDurum = "taslak" | "yayinda" | "sona_erdi" | "arsiv";
export type BasvuruTipi = "url" | "eposta";

export const CALISMA_TIPI: Record<CalismaTipi, string> = {
  tam_zamanli: "Tam zamanlı",
  yari_zamanli: "Part-time",
  freelance: "Freelance",
  staj: "Staj",
};
export const CALISMA_MODELI: Record<CalismaModeli, string> = {
  ofis: "Ofis",
  hibrit: "Hibrit",
  uzaktan: "Remote",
};
export const SEVIYE: Record<Seviye, string> = {
  giris: "Giriş seviyesi",
  orta: "Orta seviye",
  kidemli: "Kıdemli",
  yonetici: "Yönetici",
  fark_etmez: "Tüm seviyeler",
};
export const DURUM: Record<IlanDurum, string> = {
  taslak: "Taslak",
  yayinda: "Yayında",
  sona_erdi: "Süresi doldu",
  arsiv: "Arşiv",
};

/** Formdaki kategori önerileri; serbest metin de girilebiliyor. */
export const KATEGORI_ONERILERI = [
  "Performans pazarlama",
  "Sosyal medya",
  "İçerik ve metin yazarlığı",
  "Tasarım ve kreatif",
  "Analitik ve veri",
  "E-ticaret",
  "SEO",
  "Yapay zeka",
  "Satış ve iş geliştirme",
];

export type Ilan = {
  id: string;
  pozisyon: string;
  sirketAdi: string;
  sirketLogo: string | null;
  sirketWeb: string | null;
  kategori: string;
  calismaTipi: CalismaTipi;
  calismaModeli: CalismaModeli;
  sehir: string | null;
  seviye: Seviye;
  aciklama: string;
  sorumluluklar: string[];
  arananOzellikler: string[];
  tercihenOzellikler: string[];
  ucret: string | null;
  basvuruTipi: BasvuruTipi;
  basvuruAdresi: string;
  /** YYYY-MM-DD; bu günün sonuna kadar açık (Türkiye). */
  sonBasvuru: string | null;
  durum: IlanDurum;
  oneCikan: boolean;
  yayinTarihi: string | null;
  guncelleme: string;
};

/** Türkiye'de bugünün tarihi: "2026-09-24". */
export function bugunTR(an: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TR_ZAMAN, year: "numeric", month: "2-digit", day: "2-digit" }).format(an);
}

/** Başvuru kapalı mı? Veritabanındaki is_ilani_suresi_doldu ile aynı kural. */
export function suresiDoldu(ilan: Pick<Ilan, "durum" | "sonBasvuru">, bugun: string = bugunTR()): boolean {
  return ilan.durum === "sona_erdi" || (ilan.sonBasvuru !== null && ilan.sonBasvuru < bugun);
}

/** Son başvuruya kalan gün (bugün son günse 0). Tarih yoksa null. */
export function kalanGun(sonBasvuru: string | null, bugun: string = bugunTR()): number | null {
  if (!sonBasvuru) return null;
  return Math.round((Date.parse(`${sonBasvuru}T00:00:00Z`) - Date.parse(`${bugun}T00:00:00Z`)) / 86400000);
}

/** "İstanbul · Hibrit", "Remote" … */
export function lokasyonMetni(ilan: Pick<Ilan, "sehir" | "calismaModeli">): string {
  const model = CALISMA_MODELI[ilan.calismaModeli];
  return ilan.sehir ? `${ilan.sehir} · ${model}` : model;
}

/** Başvur düğmesinin hedefi. E-postada konu satırı hazır geliyor. */
export function basvuruHedefi(ilan: Pick<Ilan, "basvuruTipi" | "basvuruAdresi" | "pozisyon">): string {
  if (ilan.basvuruTipi === "eposta") {
    return `mailto:${ilan.basvuruAdresi}?subject=${encodeURIComponent(`Başvuru: ${ilan.pozisyon}`)}`;
  }
  return ilan.basvuruAdresi;
}

// ——— Yönetim formu doğrulaması ———

export type IlanGirdi = {
  pozisyon: string;
  sirketAdi: string;
  sirketLogo: string | null;
  sirketWeb: string;
  kategori: string;
  calismaTipi: CalismaTipi;
  calismaModeli: CalismaModeli;
  sehir: string;
  seviye: Seviye;
  aciklama: string;
  sorumluluklar: string;
  arananOzellikler: string;
  tercihenOzellikler: string;
  ucret: string;
  basvuruTipi: BasvuruTipi;
  basvuruAdresi: string;
  sonBasvuru: string;
  durum: IlanDurum;
  oneCikan: boolean;
};

/** Madde listesi: her satır bir madde; baştaki "-", "•", "*" ve boş satırlar atılıyor. */
export function maddeler(metin: string): string[] {
  return metin
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 30);
}

const URL_RE = /^https?:\/\/[^\s]+$/i;
const EPOSTA_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function anahtarMi<T extends string>(kume: Record<T, string>, deger: string): deger is T {
  return Object.prototype.hasOwnProperty.call(kume, deger);
}

/** Veritabanı satırına dönüştürür ya da ilk hatayı döndürür. */
export function ilanGirdisiniDogrula(g: IlanGirdi):
  | { hata: string }
  | {
      satir: {
        pozisyon: string;
        sirket_adi: string;
        sirket_logo: string | null;
        sirket_web: string | null;
        kategori: string;
        calisma_tipi: CalismaTipi;
        calisma_modeli: CalismaModeli;
        sehir: string | null;
        seviye: Seviye;
        aciklama: string;
        sorumluluklar: string[];
        aranan_ozellikler: string[];
        tercihen_ozellikler: string[];
        ucret: string | null;
        basvuru_tipi: BasvuruTipi;
        basvuru_adresi: string;
        son_basvuru: string | null;
        durum: IlanDurum;
        one_cikan: boolean;
      };
    } {
  const pozisyon = g.pozisyon.trim();
  const sirketAdi = g.sirketAdi.trim();
  if (pozisyon.length < 2) return { hata: "Pozisyon adı zorunlu." };
  if (!sirketAdi) return { hata: "Şirket adı zorunlu." };
  if (!anahtarMi(CALISMA_TIPI, g.calismaTipi)) return { hata: "Çalışma tipi geçersiz." };
  if (!anahtarMi(CALISMA_MODELI, g.calismaModeli)) return { hata: "Çalışma modeli geçersiz." };
  if (!anahtarMi(SEVIYE, g.seviye)) return { hata: "Seviye geçersiz." };
  if (!anahtarMi(DURUM, g.durum)) return { hata: "Durum geçersiz." };

  const sehir = g.sehir.trim();
  if (g.calismaModeli !== "uzaktan" && !sehir) return { hata: "Ofis ve hibrit ilanlarda şehir zorunlu." };

  const adres = g.basvuruAdresi.trim();
  if (g.basvuruTipi === "url") {
    if (!URL_RE.test(adres)) return { hata: "Başvuru bağlantısı http(s):// ile başlamalı." };
  } else if (g.basvuruTipi === "eposta") {
    if (!EPOSTA_RE.test(adres)) return { hata: "Başvuru e-posta adresi geçersiz." };
  } else {
    return { hata: "Başvuru yöntemi geçersiz." };
  }

  const web = g.sirketWeb.trim();
  if (web && !URL_RE.test(web)) return { hata: "Şirket web adresi http(s):// ile başlamalı." };

  const son = g.sonBasvuru.trim();
  if (son && !/^\d{4}-\d{2}-\d{2}$/.test(son)) return { hata: "Son başvuru tarihi geçersiz." };

  const aciklama = g.aciklama.trim();
  if (g.durum === "yayinda" && !aciklama) return { hata: "Yayınlamadan önce açıklama gir." };

  return {
    satir: {
      pozisyon,
      sirket_adi: sirketAdi,
      sirket_logo: g.sirketLogo || null,
      sirket_web: web || null,
      kategori: g.kategori.trim() || "Genel",
      calisma_tipi: g.calismaTipi,
      calisma_modeli: g.calismaModeli,
      sehir: sehir || null,
      seviye: g.seviye,
      aciklama,
      sorumluluklar: maddeler(g.sorumluluklar),
      aranan_ozellikler: maddeler(g.arananOzellikler),
      tercihen_ozellikler: maddeler(g.tercihenOzellikler),
      ucret: g.ucret.trim() || null,
      basvuru_tipi: g.basvuruTipi,
      basvuru_adresi: adres,
      son_basvuru: son || null,
      durum: g.durum,
      one_cikan: g.oneCikan,
    },
  };
}
