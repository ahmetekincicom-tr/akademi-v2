/**
 * WordPress'ten bu projeye taşınma haritası.
 *
 * Site ahmetekinciakademi.com adresinde WordPress olarak yayındaydı. Kök artık
 * bu Next.js uygulamasında; aşağıdaki adresler ise eski sitede indekslenmiş,
 * sıralaması ve bağlantı değeri olan sayfalar.
 *
 * ————————————————————————————————————————————————————————————
 * NEDEN 301 (kalıcı) ve neden BİREBİR
 *
 * 301, biriken sinyalin neredeyse tamamını yeni adrese taşıyor. Şart olan iki
 * şey var:
 *
 *  1) Hedef, eski sayfanın KONUSUNUN karşılığı olmalı. Karşılığı olmayan bir
 *     sayfayı ana sayfaya yönlendirmek Google'ın "soft 404" saydığı davranış:
 *     yönlendirme yok sayılıyor ve o sayfanın bütün değeri siliniyor. Bu
 *     yüzden karşılığı olmayan eski sayfalar bu listede YOK — onlar
 *     WordPress'te kalmaya devam ediyor (next.config.ts'teki fallback
 *     rewrite).
 *
 *  2) Zincir olmamalı. A→B→C her sıçramada biraz değer eritiyor ve tarayıcı
 *     bütçesini harcıyor. Aşağıdaki testler bir kaynağın aynı zamanda hedef
 *     olmadığını doğruluyor.
 *
 * ————————————————————————————————————————————————————————————
 * YIL BİLGİSİ ARTIK ADRESTE DEĞİL
 *
 * Eski adreslerin bir kısmı "...-2026" ile bitiyordu ve her yıl elle
 * güncelleniyordu. Bu, her Ocak ayında yeni bir adres ve yeni bir
 * yönlendirme demek; birkaç yıl sonra 2024→2025→2026 zinciri oluşuyor ve
 * adresin biriktirdiği değer her yıl sıfırlanıyor.
 *
 * Aranan "güncel" etkisi zaten arama sonucunda BAŞLIKTAN okunuyor, adresten
 * değil. Bu yüzden yeni adresler yılsız; yıl sayfa başlığında güncelleniyor.
 * Aşağıdaki yönlendirmeler bir kereye mahsus, bir daha tekrarlanmayacak.
 */

export type Yonlendirme = { eski: string; yeni: string };

/**
 * Eski WordPress adresi → yeni adres.
 *
 * Sondaki eğik çizgi YAZILMIYOR: next.config.ts'te trailingSlash açık ve Next
 * iki biçimi de bu kaynakla eşliyor.
 */
export const YONLENDIRMELER: Yonlendirme[] = [
  // ---------------------------------------------------------- eğitimler ---
  { eski: "/birebir-meta-business-egitimi-2026", yeni: "/egitimler/meta-ads-egitimi" },
  {
    eski: "/birebir-sosyal-medya-ve-reklam-uzmanligi-egitimi-2026",
    yeni: "/egitimler/sosyal-medya-ve-reklam-egitimi",
  },
  { eski: "/birebir-yapay-zeka-egitimi", yeni: "/egitimler/yapay-zeka-egitimi" },
  {
    eski: "/ankara-sosyal-medya-reklam-egitimi",
    yeni: "/egitimler/ankara-sosyal-medya-meta-ads-egitimi",
  },
  {
    eski: "/isletmeler-icin-sosyal-medya-reklam-egitimi",
    yeni: "/egitimler/isletmelere-ozel-sosyal-medya-ve-reklam-egitimi",
  },
  { eski: "/birebir-egitimler", yeni: "/egitimler" },
  { eski: "/kurumsal-meta-ads-egitimi", yeni: "/kurumsal" },

  // -------------------------------------------------------- yasal metin ---
  { eski: "/sartlar-ve-kosullar", yeni: "/uyelik-sozlesmesi" },
  // Ayrı bir çerez politikası sayfası yok; konu gizlilik politikasının içinde
  // ve çerez bandı da oraya bağlanıyor.
  { eski: "/cerez-politikasi", yeni: "/gizlilik-politikasi" },
];

/**
 * Adresi bu uygulama mı karşılıyor?
 *
 * Yalnızca testler için: bir yönlendirmenin hedefi uygulamanın gerçekten
 * sunduğu bir yola gitmeli, yoksa 404'e yönlendirmiş oluruz.
 */
export const UYGULAMA_YOLLARI = [
  "/",
  "/egitimler",
  "/hakkimizda",
  "/kurumsal",
  "/referanslar",
  "/yorumlar",
  "/iletisim",
  "/giris",
  "/kayit",
  "/gizlilik-politikasi",
  "/kisisel-verilerin-islenmesi",
  "/iptal-iade-politikasi",
  "/satis-sozlesmesi",
  "/uyelik-sozlesmesi",
];
