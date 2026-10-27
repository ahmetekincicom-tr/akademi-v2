/**
 * Kalıcı olarak kaldırılan WordPress sayfaları → 410 Gone.
 *
 * Bu sayfaların yeni projede KARŞILIĞI YOK: sepet/ödeme akışı (WooCommerce),
 * bakım/elementor sistem sayfaları ve kaldırılan eğitimler (Photoshop, After
 * Effects, UGC, Freelance Mentorluk). Karşılıksız bir sayfayı alakasız bir yere
 * 301'lemek Google'ın "soft 404" saydığı, değeri silen davranış. 410 ise "bu
 * içerik kalıcı olarak gitti" demenin doğru yolu: arama motoru adresi dizinden
 * 404'e göre daha hızlı düşürüyor ve tarama bütçesini boşa harcamıyor.
 *
 * Gerçek karşılığı OLANLAR burada değil; onlar 301 (src/lib/tasima.ts).
 */
export const GONE_YOLLARI = new Set([
  "/sepet",
  "/sepet-2",
  "/checkout-3",
  "/bakim",
  "/elementor-12265",
  "/birebir-adobe-photoshop-egitimi",
  "/birebir-adobe-after-effects-egitimi-2025",
  "/birebir-influencer-ugc-olma-egitimi",
  "/freelance-mentorluk-programi",
]);

/**
 * Kalıcı olarak kaldırılan WordPress ARŞİV önekleri → 410 Gone.
 *
 * Etiket (/tag) ve yazar (/author) arşivlerinin yeni projede karşılığı yok.
 * Kategori arşivleri taşındı ve kökte sunuluyor; etiket/yazar sayfaları ise
 * ince içerik oldukları için taşınmadı.
 */
export const GONE_ONEKLER = ["/tag", "/author"];

export function goneMi(yolSade: string): boolean {
  if (GONE_YOLLARI.has(yolSade)) return true;
  return GONE_ONEKLER.some((k) => yolSade === k || yolSade.startsWith(k + "/"));
}
