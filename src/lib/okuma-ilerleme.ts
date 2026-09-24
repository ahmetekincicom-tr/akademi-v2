/**
 * Blog okuma ilerlemesi (saf — test edilebilir).
 *
 * Oran, sayfanın değil MAKALE İÇERİĞİNİN okunma oranı: içeriğin üstü yapışkan
 * başlığın altına geldiğinde 0, içeriğin sonu ekranın altına geldiğinde 1.
 * Böylece ilgili yazılar/footer çubuğu şişirmiyor. (Analitikteki scroll
 * eşikleri "görülen içerik" ölçüyor; bu farklı bir soru, ona dokunulmadı.)
 */
export function okumaOrani(p: {
  /** İçerik kutusunun viewport'a göre üst kenarı (getBoundingClientRect().top). */
  ust: number;
  /** İçerik kutusunun yüksekliği. */
  yukseklik: number;
  /** Viewport yüksekliği. */
  ekran: number;
  /** Yapışkan başlık yüksekliği (--baslik-h). */
  ofset: number;
}): number | null {
  const kaydirilabilir = p.yukseklik - (p.ekran - p.ofset);
  // Tek ekrana sığan içerikte ilerleme anlamsız → çubuk gösterilmez.
  if (kaydirilabilir <= 0) return null;
  const oran = (p.ofset - p.ust) / kaydirilabilir;
  return Math.max(0, Math.min(1, oran));
}
