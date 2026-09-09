"use client";

import { useRef, type ReactNode } from "react";
import { whatsappLink } from "@/lib/iletisim";
import { kodUret, kodluMesaj } from "@/lib/temas-kod";

/**
 * WhatsApp düğmesi — DOĞRUDAN wa.me'ye giden bağlantı.
 *
 * ————————————————————————————————————————————————————————————
 * NEDEN ARADA BİR DURAK YOK
 *
 * Bu düğmeler önce kendi sunucumuzdaki /git/whatsapp adresine gidiyor, orada
 * takip kaydı yazılıyor ve oradan wa.me'ye yönlendiriliyordu. O yönlendirme
 * iki şeyi birden bozuyordu:
 *
 *  1. iOS, BAŞKA BİR ALAN ADINDAN gelen bir yönlendirmeyle wa.me'ye
 *     düşüldüğünde WhatsApp uygulamasını AÇMIYOR — tarayıcıda "sohbete devam
 *     et" sayfasını gösteriyor. Universal Links yalnızca kullanıcının
 *     doğrudan dokunduğu bağlantıda çalışıyor; sunucu yönlendirmesi o
 *     dokunuş sayılmıyor.
 *  2. Kişi, yönlendirme dönene kadar bekliyordu.
 *
 * Artık bağlantının href'i doğrudan wa.me. Tarayıcı için bu, elle yazılmış
 * bir WhatsApp bağlantısından farksız: dokunulduğu anda uygulama açılıyor.
 *
 * ————————————————————————————————————————————————————————————
 * PEKİ TAKİP KODU
 *
 * Kod artık TIKLAMA ANINDA burada üretiliyor ve iki yere birden gidiyor:
 * mesajın sonuna ve /api/temas'a bir işaret olarak. İşaret sendBeacon ile
 * gönderiliyor — sayfa terk edilirken bile gönderimi garanti eden tarayıcı
 * mekanizması bu; tam olarak bu iş için var.
 *
 * Kodun sayfa çizilirken değil tıklanırken üretilmesi bilinçli: sayfayı açıp
 * hiç tıklamayan kişi için kod üretilmiyor ve sayfa önbelleğe alınsa bile
 * herkes aynı kodu taşımıyor.
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

  /*
    Kodsuz adres sunucuda çiziliyor ve HTML'de öyle duruyor. Tıklanınca
    aşağıda kodlu hâliyle değiştiriliyor.

    Neden href'i değiştirip varsayılan davranışı bırakıyoruz da
    preventDefault + location.href yapmıyoruz: iOS'ta uygulamayı açan şey
    KULLANICININ DOKUNUŞUYLA BAŞLAYAN gezinme. JavaScript'in kendi başlattığı
    bir gezinme (location.href atamak) o ayrıcalığı taşımıyor ve yine
    tarayıcıda açılıyordu. href'i yerinde değiştirmek dokunuşu bozmuyor.
  */
  const tikla = () => {
    const kod = kodUret();
    const kodlu = whatsappLink(numara, kodluMesaj(mesaj, kod));
    if (baglanti.current) baglanti.current.href = kodlu;

    /*
      İşaret gönderiliyor ama SONUCU BEKLENMİYOR ve hata yutuluyor:
      ölçümlemenin tökezlemesi kişinin WhatsApp'a gitmesini engellememeli.
      sendBeacon yoksa (çok eski tarayıcı) keepalive'lı fetch deneniyor;
      o da yoksa kayıt atlanıyor.
    */
    const govde = JSON.stringify({ kod, yer, no });
    /*
      Adres sondaki eğik çizgiyle: next.config.ts'te trailingSlash açık ve
      çizgisiz yazılırsa işaret önce 308 yiyor. Beacon yönlendirmeyi izliyor
      ama sayfa terk edilirken fazladan bir tur, kaybedilme riski demek.
    */
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
        sekmede gidildiğinde uygulama devralıyor, tarayıcı sayfada kalıyor:
        geri dönen kişi bulunduğu yeri buluyor.
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
