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
