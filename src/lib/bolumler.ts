/**
 * Henüz açılmamış panel bölümleri.
 *
 * Ders videoları hazır değil. "Derslerim" açık kaldığı sürece panel, içi boş
 * bir oynatıcıya ve her yerde %0 yazan ilerleme sayılarına götürüyordu —
 * katılımcı için bu, çalışmayan bir üründen ayırt edilemiyor.
 *
 * Kapatma tek bir yerden yapılıyor, üç ayrı dosyaya "şimdilik gizle" koyarak
 * değil: menü, bağlantılar ve sayfanın kendisi aynı bayrağa bakıyor. Videolar
 * bitince burada tek satır değişecek.
 *
 * Bölüm menüden silinmiyor, "Çok yakında" etiketiyle duruyor: yolun var
 * olduğunu göstermek, sonradan hiç yoktan belirmesinden anlaşılır.
 */
export const DERSLER_ACIK = false;

/**
 * İş fırsatları (/panel/firsatlar).
 *
 * Kapalıyken menüde "Çok yakında" etiketiyle duruyor ve öğrenci sayfaya
 * giremiyor; yönetici ise ilk ilanları girip öğrencinin göreceği ekranı
 * önizleyebilsin diye sayfayı açabiliyor. İlk ilan yayına alındığında burası
 * true yapılacak — menü ve sayfa aynı bayrağa bakıyor.
 */
export const FIRSATLAR_ACIK = false;

/**
 * Google ile giriş / kayıt.
 *
 * Supabase → Authentication → Providers → Google açılıp Google Cloud OAuth
 * istemcisi girilene kadar KAPALI: sağlayıcı kapalıyken düğme, Supabase'in
 * ham JSON hata sayfasına götürüyor. Kurulum bitince true yapılacak
 * (adımlar: docs/google-giris.md).
 */
export const GOOGLE_GIRIS_ACIK = false;
