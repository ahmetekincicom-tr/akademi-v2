/**
 * Görselsiz blog kapağı: renk tonları, simgeler, kategori varsayılanları.
 *
 * Kapak görseli yüklenmemiş yazıda boş gri kutu yerine çizilen kapak:
 * tonun geçişi + noktalı desen + halkalar + ortada camdan bir kutuda simge.
 * Kaynak: ahmetekinci.com.tr (packages/shared/src/blogCover.ts); tasarım
 * aynı, renkler akademinin paleti (globals.css → --color-brand, --color-ink).
 *
 * Görünüm önce yazıya özel seçimden (panelde, Faz 3), yoksa kategoriden
 * geliyor. Tanınmayan kategoride slug'dan türetilen sabit bir görünüm:
 * aynı kategori her yerde aynı renkte.
 *
 * Simgeler 24×24, çizgi = currentColor, dolgu yok. Kapak süs: sayfada
 * başlık zaten H1/kart başlığı, kapak aria-hidden.
 */

export const KAPAK_TONLARI = ["lacivert", "mavi", "gece", "turkuaz", "mor", "hardal"] as const;
export type KapakTonu = (typeof KAPAK_TONLARI)[number];

/** Panelde gösterilen adlar. */
export const KAPAK_TON_ADLARI: Record<KapakTonu, string> = {
  lacivert: "Lacivert",
  mavi: "Mavi",
  gece: "Gece mavisi",
  turkuaz: "Turkuaz",
  mor: "Mor",
  hardal: "Hardal",
};

/*
  Zeminin ana rengi. "mavi" akademinin marka rengi (#1c56f3). Hepsinin
  üzerinde beyaz simge 3:1'in üstünde kalacak koyulukta: simge süs ama
  seçilemeyecek kadar soluk durmasın. Geçişin bittiği renk her tonda
  akademinin mürekkebi (#0a0d18).
*/
export const KAPAK_TON_RENKLERI: Record<KapakTonu, string> = {
  lacivert: "#16224a",
  mavi: "#1c56f3",
  gece: "#1238a6",
  turkuaz: "#0b6e7a",
  mor: "#4b3bc7",
  hardal: "#8a5a00",
};

export const KAPAK_SIMGE_YOLLARI = {
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  megaphone: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  funnel: '<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  sparkle: '<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/>',
  server:
    '<rect x="4" y="4" width="16" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.8"/><path d="M7.5 7.25h.01M7.5 16.75h.01M11 7.25h5.5M11 16.75h5.5"/>',
  chart: '<path d="M4 20h16"/><path d="M6.5 16v-4M11 16V8M15.5 16v-6M20 16V5"/>',
  chat: '<path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.6A7.5 7.5 0 1 1 20 12z"/><path d="M9 11h.01M12.5 11h.01M16 11h.01"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>',
  video: '<rect x="3.5" y="6" width="12.5" height="12" rx="2.2"/><path d="m16 10.5 4.5-2.5v8L16 13.5"/>',
  camera: '<path d="M4 8.5h3.2L9 6h6l1.8 2.5H20v10.5H4z"/><circle cx="12" cy="13.5" r="3.3"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  cart: '<path d="M3.5 5h2.5l2 10h10l2-7H7"/><circle cx="9.5" cy="19" r="1.2"/><circle cx="16.5" cy="19" r="1.2"/>',
  pin: '<path d="M12 20.5s-6.5-5.6-6.5-10.8a6.5 6.5 0 0 1 13 0c0 5.2-6.5 10.8-6.5 10.8z"/><circle cx="12" cy="9.8" r="2.4"/>',
  code: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>',
  phone: '<rect x="7" y="3.5" width="10" height="17" rx="2.2"/><path d="M11 17.5h2"/>',
  users:
    '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.5 14.3a4.5 4.5 0 0 1 5 5.2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><path d="m4 7 8 6 8-6"/>',
  globe:
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  palette:
    '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 2-2 0-1.5-1.5-1.8-1.5-3 0-1 .8-1.5 2-1.5h2c2.2 0 4-1.6 4-4 0-3.7-3.8-6.5-8.5-6.5z"/><path d="M7.5 11.5h.01M9.5 7.5h.01M14.5 7.5h.01"/>',
  bolt: '<path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z"/>',
  star: '<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7z"/>',
  graduation: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.5c3.3 2.5 7.7 2.5 11 0v-4.5M21.5 9.5v5"/>',
} as const;

export type KapakSimgesi = keyof typeof KAPAK_SIMGE_YOLLARI;
export const KAPAK_SIMGELERI = Object.keys(KAPAK_SIMGE_YOLLARI) as KapakSimgesi[];

/** Panelde gösterilen anlamlar. */
export const KAPAK_SIMGE_ADLARI: Record<KapakSimgesi, string> = {
  target: "Hedef (hedefleme, kampanya)",
  megaphone: "Hoparlör (reklam, duyuru)",
  search: "Büyüteç (arama, Google)",
  funnel: "Huni (satış hunisi, dönüşüm)",
  calendar: "Takvim (planlama)",
  sparkle: "Parıltı (yapay zekâ, yaratıcılık)",
  server: "Sunucu (API, ölçüm altyapısı)",
  chart: "Grafik (rapor, analiz)",
  chat: "Mesaj balonu (WhatsApp, DM)",
  heart: "Kalp (etkileşim, sadakat)",
  video: "Video (Reels, TikTok, YouTube)",
  camera: "Fotoğraf makinesi (çekim, görsel)",
  shield: "Kalkan (güvenlik, hesap kurtarma)",
  cart: "Sepet (e-ticaret)",
  pin: "Konum (yerel işletme, şehir)",
  code: "Kod (web, yazılım)",
  phone: "Telefon (mobil)",
  users: "Kişiler (topluluk, ekip)",
  mail: "Zarf (e-posta)",
  globe: "Dünya (web sitesi, SEO)",
  link: "Bağlantı (entegrasyon)",
  palette: "Palet (tasarım, marka)",
  bolt: "Şimşek (hız, otomasyon)",
  star: "Yıldız (yorum, itibar)",
  graduation: "Kep (eğitim, kariyer)",
};

export type KapakGorunumu = { ton: KapakTonu; simge: KapakSimgesi };

/** Onaylanan kategorilerin görünümü (27.10.2026 kategori düzeni). */
const KATEGORI_GORUNUMU: Record<string, KapakGorunumu> = {
  "sosyal-medya": { ton: "mavi", simge: "megaphone" },
  "meta-business-manager": { ton: "lacivert", simge: "target" },
  tiktok: { ton: "turkuaz", simge: "video" },
  "dijital-pazarlama": { ton: "gece", simge: "graduation" },
  "yapay-zeka": { ton: "mor", simge: "sparkle" },
};

/** Tanınmayan kategoride yalnız ilk altı simge: genel anlamlılar. */
const YEDEK_SIMGELER: KapakSimgesi[] = ["target", "megaphone", "search", "funnel", "calendar", "sparkle"];

export const kapakTonuMu = (d: unknown): d is KapakTonu =>
  typeof d === "string" && (KAPAK_TONLARI as readonly string[]).includes(d);
export const kapakSimgesiMi = (d: unknown): d is KapakSimgesi =>
  typeof d === "string" && Object.prototype.hasOwnProperty.call(KAPAK_SIMGE_YOLLARI, d);

/** Kategorinin görünümü; kategorisiz yazı markanın mavisi. */
export function kategoriGorunumu(kategoriSlug: string | null | undefined): KapakGorunumu {
  if (!kategoriSlug) return { ton: "mavi", simge: "graduation" };
  const tanimli = KATEGORI_GORUNUMU[kategoriSlug];
  if (tanimli) return tanimli;
  let h = 0;
  for (const c of kategoriSlug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { ton: KAPAK_TONLARI[h % KAPAK_TONLARI.length], simge: YEDEK_SIMGELER[h % YEDEK_SIMGELER.length] };
}

/** Yazının kapak görünümü: geçerli özel seçim varsa o, yoksa kategorininki. Alanlar tek tek. */
export function kapakGorunumu(
  kategoriSlug: string | null | undefined,
  ozel?: { ton?: string | null; simge?: string | null },
): KapakGorunumu {
  const varsayilan = kategoriGorunumu(kategoriSlug);
  return {
    ton: kapakTonuMu(ozel?.ton) ? ozel.ton : varsayilan.ton,
    simge: kapakSimgesiMi(ozel?.simge) ? ozel.simge : varsayilan.simge,
  };
}
