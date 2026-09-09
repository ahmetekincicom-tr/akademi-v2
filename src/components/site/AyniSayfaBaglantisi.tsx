"use client";

import { useEffect } from "react";

/**
 * Bulunduğun sayfaya giden bağlantıya tıklandığında sayfayı başa alır.
 *
 * SORUN: Ana sayfada aşağı inip logoya (veya menüdeki "Ana Sayfa"ya)
 * tıklandığında hiçbir şey olmuyordu — sayfa ne yenileniyor ne de başa
 * dönüyordu.
 *
 * SEBEBİ: Next, hedef adres bulunulan adresle aynı olduğunda gezinmeyi
 * "yapacak bir şey yok" diye bırakıyor; sayfa üretilmiş (statik) olduğunda
 * yeniden çizim de olmadığı için başa kaydırma hiç çalışmıyor. Geliştirme
 * sunucusunda her sayfa yeniden üretildiğinden sorun görünmüyor, YALNIZCA
 * yayındaki yapıda çıkıyor — bu yüzden ölçüm üretim yapısı üzerinde yapıldı.
 *
 * ÇÖZÜM: Aynı adrese giden tıklamayı yakalayıp kaydırmayı biz yapıyoruz.
 * Kullanıcının logodan beklediği davranış zaten bu.
 *
 * Tek bir dinleyici, çünkü aynı bağlantı birden fazla yerde var: başlıktaki
 * logo, masaüstü menüsü, mobil menü, alt bilgideki logo ve "Ana Sayfa"
 * satırı. Her birine ayrı ayrı işleyici bağlamak, yarın eklenecek altıncı
 * yerin unutulması demek olurdu.
 *
 * Yükleme çizgisinin aynı adreste boşuna belirmesi ayrı bir sorundu ve
 * TopLoader'ın içinde çözüldü.
 */
export function AyniSayfaBaglantisi() {
  useEffect(() => {
    /*
      Sondaki eğik çizgi yok sayılıyor: next.config.ts'te trailingSlash açık,
      yani adres çubuğunda "/egitimler/" yazarken bir bağlantı "/egitimler"
      diye yazılmış olabilir. İkisi aynı sayfa.
    */
    const sadelestir = (yol: string) => (yol.length > 1 ? yol.replace(/\/+$/, "") : yol);

    function tiklama(olay: MouseEvent) {
      // Yeni sekmede açma, orta tuş, indirme gibi tarayıcı davranışlarına
      // dokunulmuyor.
      if (olay.button !== 0 || olay.metaKey || olay.ctrlKey || olay.shiftKey || olay.altKey) return;

      const hedef = (olay.target as Element | null)?.closest?.("a");
      if (!hedef) return;
      if (hedef.hasAttribute("download")) return;
      const sekme = hedef.getAttribute("target");
      if (sekme && sekme !== "_self") return;

      const href = hedef.getAttribute("href");
      if (!href) return;

      let adres: URL;
      try {
        adres = new URL(href, window.location.href);
      } catch {
        return;
      }

      // Dış siteler, mailto:, tel:, whatsapp bağlantıları.
      if (adres.origin !== window.location.origin) return;
      // "#sss" gibi bölüm bağlantıları kendi işini yapsın; onlar zaten
      // sayfanın başka bir yerine kaydırıyor.
      if (adres.hash) return;
      if (adres.search !== window.location.search) return;
      if (sadelestir(adres.pathname) !== sadelestir(window.location.pathname)) return;

      /*
        Tıklama ENGELLENMİYOR, yalnızca üstüne kaydırma ekleniyor.

        Engelleseydik <Link>'in kendi işleyicisine hiç sıra gelmezdi; mobil
        menüdeki bağlantılar menüyü o işleyiciyle kapatıyor ve menü açık
        kalırdı. Next'in aynı adrese yaptığı gezinme zaten hiçbir şey
        yapmıyor, dolayısıyla bırakmanın bir bedeli yok.

        Kaydırma biçimi bilerek belirtilmiyor: globals.css'te
        `scroll-behavior: smooth` var ve hareket azaltma tercihinde `auto`ya
        düşüyor. Burada "smooth" yazsaydık o tercihi ezerdik.
      */
      window.scrollTo({ top: 0, left: 0 });
    }

    /*
      Yakalama (capture) evresi şart: React kendi işleyicilerini kökte
      dinliyor ve <Link> tıklamayı orada preventDefault ediyor. Kabarma
      evresinde dinleseydik sıra bize geldiğinde olay çoktan işlenmiş olurdu.
    */
    document.addEventListener("click", tiklama, true);
    return () => document.removeEventListener("click", tiklama, true);
  }, []);

  return null;
}
