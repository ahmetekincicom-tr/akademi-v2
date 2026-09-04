/**
 * Yüklenen dosyaların adresi — HEP KENDİ ALAN ADIMIZDAN.
 *
 * Depolama Supabase Storage'ta ama adres asla oraya işaret etmiyor. Önceden
 * kapaklar, logolar, marka görselleri ve doküman indirmeleri doğrudan
 * `<proje>.supabase.co/storage/...` adresini veriyordu; sayfanın kaynağında,
 * adres çubuğunda ve paylaşılan indirme bağlantısında altyapının adı
 * görünüyordu.
 *
 * Bunun üç somut bedeli vardı:
 *
 *   1. Marka: öğrenciye gönderilen bir PDF bağlantısı bizim adımızı değil
 *      Supabase'inkini taşıyordu.
 *   2. Taşınabilirlik: depolama sağlayıcısı değişirse yayımlanmış her
 *      bağlantı ölürdü. Adres kendi alan adımızdayken sağlayıcı bir
 *      uygulama ayrıntısı olarak kalıyor.
 *   3. Doküman indirmelerinde imzalı adres (60 sn geçerli) kullanıcıya
 *      görünüyordu; kopyalanıp paylaşıldığında ne olduğu belirsiz bir
 *      bağlantı oluyordu.
 *
 * Yol şu: tarayıcı /dosya/... adresini istiyor, sunucu dosyayı Supabase'ten
 * çekip aynı yanıtta akıtıyor. Supabase adresi sunucuda kalıyor.
 */

/** Herkese açık kovalar; bunlar /dosya üzerinden yayımlanıyor. */
export const ACIK_KOVALAR = ["kapaklar", "marka", "logolar"] as const;
export type AcikKova = (typeof ACIK_KOVALAR)[number];

export function acikKovaMi(deger: string): deger is AcikKova {
  return (ACIK_KOVALAR as readonly string[]).includes(deger);
}

/**
 * Depodaki bir dosyanın SİTE üzerindeki adresi.
 *
 * Yol parçaları tek tek kodlanıyor: dosya adlarında boşluk ve Türkçe harf
 * olabiliyor, tamamını encodeURIComponent'ten geçirmek ise "/" işaretlerini
 * de kodlayıp yolu bozardı.
 */
export function depoUrl(kova: AcikKova, yol: string | null): string | null {
  if (!yol) return null;
  // Zaten tam adres yazılmış eski kayıtlar olduğu gibi bırakılıyor; onları
  // kendi ucumuzdan geçirmeye çalışmak bozuk bir adres üretirdi.
  if (/^https?:\/\//i.test(yol)) return yol;

  const temiz = yol.replace(/^\/+/, "");
  const parcalar = temiz.split("/").map(encodeURIComponent).join("/");
  return `/dosya/${kova}/${parcalar}`;
}

/**
 * Supabase'teki gerçek adres. YALNIZCA SUNUCUDA kullanılıyor — /dosya ucu
 * dosyayı buradan çekiyor.
 */
export function supabaseNesneUrl(kova: string, yol: string): string | null {
  const kok = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!kok) return null;
  const parcalar = yol.split("/").map(encodeURIComponent).join("/");
  return `${kok.replace(/\/$/, "")}/storage/v1/object/public/${kova}/${parcalar}`;
}

/**
 * Dışarıya çıkan mutlak adres.
 *
 * İki yer göreli adresle çalışmıyor ve ikisi de sessizce bozulur:
 *
 *   * og:image — paylaşım kartını üreten robot (WhatsApp, LinkedIn) sayfayı
 *     bizim alan adımızdan okumuyor, "/dosya/..." onun için bir yere
 *     işaret etmiyor.
 *   * e-posta logosu — posta istemcisinin göreli adresi çözecek bir kökü yok.
 *
 * Zaten mutlak olan (eski kayıtlar) olduğu gibi geçiyor.
 */
export function mutlakDepoUrl(yol: string | null, kok?: string | null): string | null {
  if (!yol) return null;
  if (/^https?:\/\//i.test(yol)) return yol;
  const taban = (kok ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://panel.ahmetekinciakademi.com").replace(
    /\/$/,
    "",
  );
  return `${taban}${yol.startsWith("/") ? "" : "/"}${yol}`;
}
