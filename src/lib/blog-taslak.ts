/**
 * Blog editörü yerel taslağı (otomatik kaydetme / kurtarma).
 *
 * Amaç: yazar içerik yazarken tarayıcı/PC çökse bile emeği kaybolmasın.
 * İçerik ve tüm form alanları her düzenlemede (debounce'lu) tarayıcının
 * localStorage'ına yazılır; editör tekrar açıldığında geçerli bir taslak
 * varsa "kaldığın yerden devam et" seçeneği sunulur. Sunucuya manuel kayıt
 * akışı DEĞİŞMEZ; bu yalnız yerel bir güvenlik ağı.
 *
 * Neden localStorage (sunucu değil): çökme/çevrimdışı durumunda bile çalışır,
 * her tuşta sunucuya yazmaz (yük/yarış yok) ve tek yazarlı yönetim paneli için
 * yeterli. Sunucuya yazma yine "Kaydet" ile (ya da ileride debounce'lu sunucu
 * autosave eklenebilir).
 */

export const TASLAK_SURUM = 1;

/** Editörde saklanan tüm düzenlenebilir alanlar. */
export type TaslakAlanlar = {
  baslik: string;
  slug: string;
  slugElle: boolean;
  ozet: string;
  kapakYol: string | null;
  durum: "taslak" | "yayin";
  yayinYerel: string;
  seoBaslik: string;
  seoAciklama: string;
  yazar: string;
  kategoriId: string;
  etiketMetni: string;
  icerikHtml: string;
  icerikJson: unknown;
};

export type BlogTaslak = TaslakAlanlar & {
  /** Şema sürümü — biçim değişirse eski taslaklar yok sayılır. */
  s: number;
  /** Son otomatik kayıt zamanı (ms). */
  kayitZamani: number;
  /**
   * Taslağın dayandığı sunucu sürümü (mevcut.guncelleme / updated_at). Sunucu
   * o zamandan beri değiştiyse taslak bayat sayılır (örn. başka yerde kaydedildi
   * ya da bu yazı zaten kaydedildi). Yeni yazıda null.
   */
  temelGuncelleme: string | null;
};

export function taslakAnahtar(id: string | null | undefined): string {
  return `blog-taslak:v${TASLAK_SURUM}:${id ?? "yeni"}`;
}

export function taslakOku(anahtar: string): BlogTaslak | null {
  if (typeof window === "undefined") return null;
  try {
    const ham = window.localStorage.getItem(anahtar);
    if (!ham) return null;
    const t = JSON.parse(ham) as BlogTaslak;
    if (!t || t.s !== TASLAK_SURUM) return null;
    return t;
  } catch {
    return null;
  }
}

export function taslakYaz(anahtar: string, alanlar: TaslakAlanlar, temelGuncelleme: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const t: BlogTaslak = { ...alanlar, s: TASLAK_SURUM, kayitZamani: Date.now(), temelGuncelleme };
    window.localStorage.setItem(anahtar, JSON.stringify(t));
  } catch {
    // Kota dolu / gizli sekme: sessiz geç, editör çalışmaya devam etsin.
  }
}

export function taslakSil(anahtar: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(anahtar);
  } catch {
    /* yok say */
  }
}

/** HTML etiketlerini atıp görünür metin var mı diye bakar (boş içerik kontrolü). */
function metinVar(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/ /g, " ").trim().length > 0;
}

/**
 * Taslak, şu an yüklenen sunucu sürümüyle aynı temele mi dayanıyor ve gerçekten
 * kurtarılmaya değer (sunucudakinden farklı) bir içerik mi taşıyor?
 *
 * - Yeni yazı: başlık ya da içerik girilmişse değerli.
 * - Var olan yazı: yalnızca AYNI sunucu sürümüne dayanıyorsa (bayat değil) VE
 *   içerik/başlık/özet sunucudakinden farklıysa değerli.
 */
export function taslakDegerli(
  t: BlogTaslak | null,
  sunucu: { guncelleme: string; baslik: string; ozet: string; icerikHtml: string } | null,
): boolean {
  if (!t) return false;
  if (!sunucu) {
    // Yeni yazı.
    return t.baslik.trim().length > 0 || metinVar(t.icerikHtml);
  }
  if (t.temelGuncelleme !== sunucu.guncelleme) return false; // bayat
  return t.icerikHtml !== sunucu.icerikHtml || t.baslik !== sunucu.baslik || t.ozet !== sunucu.ozet;
}

/** "az önce", "3 dk önce", "2 sa önce" — taslak zaman etiketi. */
export function taslakNispiZaman(ms: number): string {
  const fark = Date.now() - ms;
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const gun = Math.floor(sa / 24);
  return `${gun} gün önce`;
}
