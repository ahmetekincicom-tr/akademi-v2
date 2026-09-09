"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { whatsappLink } from "@/lib/iletisim";
import { kodUret, kodluMesaj } from "@/lib/temas-kod";

/**
 * WhatsApp düğmesi — DOĞRUDAN wa.me'ye giden bağlantı.
 *
 * ————————————————————————————————————————————————————————————
 * NEDEN ARADA BİR DURAK YOK
 *
 * Bu düğmeler önce kendi sunucumuzdaki /git/whatsapp adresine gidip oradan
 * wa.me'ye yönlendiriliyordu. iOS, BAŞKA BİR ALAN ADINDAN gelen bir
 * yönlendirmeyle wa.me'ye düşüldüğünde WhatsApp uygulamasını açmıyor:
 * tarayıcıda wa.me'nin kendi sayfası (api.whatsapp.com) açılıyor ve kişi
 * "Uygulamayı aç" düğmesine bir kez daha basmak zorunda kalıyor.
 *
 * ————————————————————————————————————————————————————————————
 * ADRES DOKUNULMADAN ÖNCE HAZIR OLMALI
 *
 * Bu bir kez daha kaçırıldı: kod tıklama anında üretilip href o sırada
 * değiştiriliyordu. iOS, dokunulan bağlantının adresi tam o anda JavaScript
 * ile değiştirilince gezinmeyi artık "kullanıcının doğrudan dokunduğu
 * bağlantı" saymıyor ve Universal Link ayrıcalığını düşürüyor — sonuç yine
 * tarayıcıda açılan api.whatsapp.com sayfası.
 *
 * Bu yüzden kod artık SAYFA YÜKLENİRKEN (ilk çizimden hemen sonra)
 * üretiliyor ve adres o anda son hâlini alıyor. Dokunulduğunda href'e
 * dokunan hiçbir şey yok; tarayıcı için elle yazılmış bir WhatsApp
 * bağlantısından farkı kalmıyor.
 *
 * ————————————————————————————————————————————————————————————
 * TAKİP KODU
 *
 * Kod iki yere birden gidiyor: mesajın sonuna ve tıklandığında /api/temas'a
 * bir işaret olarak (navigator.sendBeacon — sayfa terk edilirken bile
 * gönderimi garanti eden mekanizma).
 *
 * Kod sunucuda değil tarayıcıda üretiliyor: sayfa önbelleğe alınsa bile her
 * ziyaretçi kendi kodunu taşısın diye. Kayıt yalnızca TIKLANIRSA yazılıyor,
 * yani açıp geçen biri için satır oluşmuyor.
 *
 * JavaScript çalışmazsa bağlantı yine çalışıyor — yalnızca kodsuz. Eskiden
 * de öyleydi; kaybedilen bir şey yok.
 */
export function WhatsAppBaglantisi({
  numara,
  mesaj,
  yer,
  /** WHATSAPP_NUMARALAR içindeki sıra; kaydın doğru numaraya yazılması için. */
  no = 0,
  className,
  children,
  ariaLabel,
  title,
}: {
  numara: string;
  /** Hazır mesaj. SUNUCUDA hazırlanıyor; adres çubuğundan gelmiyor. */
  mesaj: string;
  yer: string;
  no?: number;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  title?: string;
}) {
  const baglanti = useRef<HTMLAnchorElement>(null);
  const kod = useRef<string | null>(null);

  /*
    Kod SAYFA YÜKLENİR YÜKLENMEZ üretiliyor ve adres o anda son hâlini alıyor.
    Dokunuşa kadar fazlasıyla vakit var; dokunulduğunda href'e dokunan hiçbir
    şey kalmıyor — kritik olan bu.

    Adres state yerine doğrudan bağlantıya yazılıyor: kod rastgele olduğu için
    sunucu ile tarayıcı farklı değer üretir ve yeniden çizim, React'te
    uyuşmazlık uyarısına yol açardı. Sunucudan gelen HTML kodsuz adresi
    taşıyor (JavaScript çalışmayan tarayıcıda çalışan hâli bu), tarayıcı da
    üstüne kodlusunu yazıyor.
  */
  useEffect(() => {
    const uretilen = kodUret();
    kod.current = uretilen;
    if (baglanti.current) {
      baglanti.current.href = whatsappLink(numara, kodluMesaj(mesaj, uretilen));
    }
  }, [numara, mesaj]);

  /*
    Tıklamada YALNIZCA işaret gönderiliyor; href'e dokunulmuyor.

    Sonucu beklenmiyor ve hata yutuluyor: ölçümlemenin tökezlemesi kişinin
    WhatsApp'a gitmesini engellememeli. sendBeacon yoksa (çok eski tarayıcı)
    keepalive'lı fetch deneniyor; o da yoksa kayıt atlanıyor.
  */
  const tikla = () => {
    if (!kod.current) return;
    /*
      Adres sondaki eğik çizgiyle: next.config.ts'te trailingSlash açık ve
      çizgisiz yazılırsa işaret önce 308 yiyor. Sayfa terk edilirken fazladan
      bir tur, kaybedilme riski demek.
    */
    const govde = JSON.stringify({ kod: kod.current, yer, no });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/temas/", new Blob([govde], { type: "application/json" }));
      } else {
        void fetch("/api/temas/", {
          method: "POST",
          body: govde,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Yoksay: bağlantı her koşulda çalışsın.
    }
  };

  return (
    <a
      ref={baglanti}
      href={whatsappLink(numara, mesaj)}
      onClick={tikla}
      /*
        target="_blank" YOK — bilerek.

        Yeni sekmede açmak, telefonda uygulama açılırken geride boş bir sekme
        bırakıyor ve bazı tarayıcılarda uygulamaya geçişi geciktiriyor. Aynı
        sekmede gidildiğinde uygulama devralıyor, tarayıcı sayfada kalıyor.
      */
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </a>
  );
}
