import Link from "next/link";
import { Logo } from "./Logo";
import { Icon } from "@/components/Icon";
import { CerezTercihleriDugmesi } from "@/components/site/CerezTercihleriDugmesi";
import { FooterBolum } from "@/components/site/FooterBolum";
import { getOlcumleme, olcumlemeAcik } from "@/lib/olcumleme";
import { getCourses } from "@/lib/courses";
import { ON_YUZ_ACIK } from "@/proxy";
import {
  SOSYAL,
  WHATSAPP_NUMARALAR,
  EPOSTA,
  INSTAGRAM_KULLANICI,
  INSTAGRAM_URL,
  OFIS_ADRESI,
  olculenWhatsapp,
} from "@/lib/iletisim";

import type { IconName } from "@/components/Icon";

// ikon verilmezse listelerde ince bir "+" işareti kullanılır
type FooterLink = { label: string; href?: string; dis?: boolean; ikon?: IconName };

const footerColumns: { baslik: string; linkler: FooterLink[] }[] = [
  {
    baslik: "Akademi",
    linkler: [
      { label: "Ana sayfa", href: "/" },
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "Referanslar", href: "/referanslar" },
      { label: "Katılımcı yorumları", href: "/yorumlar" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Panele giriş", href: "/giris" },
    ],
  },
  {
    // Panel bağlantıları buradaydı; hepsi korumalı olduğu için footer'ı gören
    // çıkış yapmış ziyaretçiyi giriş ekranına atıyordu.
    baslik: "İletişim",
    linkler: [
      {
        label: WHATSAPP_NUMARALAR[0].gosterim,
        href: olculenWhatsapp("footer"),
        dis: true,
        ikon: "whatsapp",
      },
      {
        // 0545 hattı WhatsApp değil, sesli görüşme hattı. İkisini de aynı
        // ikonla WhatsApp diye listelemek arayan kişiyi yanlış hatta
        // düşürüyordu.
        label: WHATSAPP_NUMARALAR[1].gosterim,
        href: `tel:+${WHATSAPP_NUMARALAR[1].numara}`,
        dis: true,
        ikon: "phone",
      },
      { label: EPOSTA, href: `mailto:${EPOSTA}`, dis: true, ikon: "mail" },
      { label: INSTAGRAM_KULLANICI, href: INSTAGRAM_URL, dis: true, ikon: "instagram" },
      // Footer'da yalnızca "Ankara" yazıyordu. Açık adres hem yerel aramada
      // (Google, harita ve yapay zekâ arama motorları aynı NAP bilgisini
      // sitede, künyede ve schema'da görmek ister) hem de mesafeli satış
      // mevzuatında satıcının erişilebilir adresi olarak gerekiyor.
      { label: OFIS_ADRESI, ikon: "pin" },
    ],
  },
];


const YASAL_LINKLER = [
  { label: "Mesafeli satış sözleşmesi", href: "/satis-sozlesmesi" },
  { label: "İptal & iade", href: "/iptal-iade-politikasi" },
  { label: "Gizlilik & güvenlik", href: "/gizlilik-politikasi" },
  { label: "KVKK", href: "/kisisel-verilerin-islenmesi" },
];

/**
 * Eğitim sütunu veritabanından kuruluyor.
 *
 * Önceden üç eğitim elle yazılmıştı ve ikisinin adresi artık yoktu: eğitimler
 * panelden yeniden adlandırılınca bağlantılar 404'e düşmüş, üstelik sitenin
 * HER sayfasında. Elle yazılan liste er geç veriden kopuyor; bu yüzden liste
 * artık yayındaki eğitimlerin kendisi.
 */
async function egitimSutunu(): Promise<{ baslik: string; linkler: FooterLink[] }> {
  const egitimler = await getCourses();
  return {
    baslik: "Eğitim",
    linkler: [
      // Footer'ın uzamaması için ilk dördü; gerisi "Tüm eğitimler" altında.
      ...egitimler.slice(0, 4).map((e) => ({ label: e.baslik, href: `/egitimler/${e.slug}` })),
      { label: "Tüm eğitimler", href: "/egitimler" },
      { label: "Kurumsal eğitim", href: "/kurumsal" },
    ],
  };
}

export async function PublicFooter() {
  // Bant yalnızca ölçümleme tanımlıyken basılıyor. Tercih bağlantısını her
  // koşulda göstermek, tıklanınca hiçbir şey yapmayan bir buton bırakırdı.
  const [olcumleme, egitim] = await Promise.all([
    getOlcumleme(),
    ON_YUZ_ACIK ? egitimSutunu() : Promise.resolve(null),
  ]);
  const olcumlemeVar = olcumlemeAcik(olcumleme);

  /*
    Ön yüz kapalıyken tanıtım sütunları basılmıyor.

    Alt bilgi yine görünüyor çünkü yasal metin sayfaları açık; ama oradaki
    "Ana sayfa", "Hakkımızda", eğitim adları gibi bağlantıların hepsi giriş
    ekranına yönlendirilir ve tıklayan kişi çıkmaza girerdi. Kalanlar
    gerçekten çalışan bağlantılar: iletişim kanalları ve yasal metinler.
  */
  const sutunlar = ON_YUZ_ACIK
    ? [footerColumns[0], egitim!, ...footerColumns.slice(1)]
    : [{ baslik: "Akademi", linkler: [{ label: "Üye girişi", href: "/giris" }] }, ...footerColumns.slice(1)];

  return (
    <footer className="border-t border-white/10 bg-ink text-white/60">
      {/*
        Dar ekranda hizalama: marka bloğu ortalı, LİSTELER sola yaslı.

        Bir ara her şey ortalanmıştı ve footer'ın kendi içindeki hiyerarşi
        kayboldu: menü başlıkları ile bağlantılar aynı eksene binince hangisinin
        başlık olduğu okunmuyordu. Bir liste sol kenardan okunur — göz her
        satırda aynı yerden başlar. Ortalanacak olan yalnızca imza bloğu.

        Daraltma (FooterBolum) kalıyor: hepsi birden açıkken footer sayfanın
        kendisinden uzun oluyordu.
      */}
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-y-2 px-5 sm:gap-12 sm:px-8 py-14 pb-7 sm:py-16 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        {/*
          Marka bloğu dar ekranda ORTALI — footer'ın geri kalanı sola yaslı.

          İstisna bilinçli: logo, tanıtım cümlesi ve sosyal ikonlar bir liste
          değil, tek bir imza bloğu. Ortalanınca footer'a bir açılış veriyor;
          altındaki menü ve iletişim listeleri ise sola yaslı kalıyor, çünkü
          orada okunması gereken şey hizalı bir sütun.

          Alttaki çizgi de yalnızca dar ekranda: orada blok ile menüler aynı
          sütuna indiği için ayrım gerekiyor.
        */}
        <div className="mb-2 flex flex-col items-center border-b border-white/[0.08] pb-7 text-center sm:mb-0 sm:items-start sm:border-b-0 sm:pb-0 sm:text-left">
          {/* Ön yüz kapalıyken logo ana sayfaya değil giriş ekranına bakıyor. */}
          <Logo variant="light" yer="alt" href={ON_YUZ_ACIK ? "/" : "/giris"} />
          <p className="mt-[18px] max-w-[280px] text-[14.5px] leading-[1.65]">
            Dijital çağın dinamiklerine uygun, yenilikçi eğitim deneyimi.
          </p>
          <div className="mt-[22px] flex gap-[10px]">
            {SOSYAL.map((s) => (
              <a
                key={s.ad}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.ad}
                title={s.ad}
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-white/14 text-white/70 transition hover:border-brand hover:bg-brand hover:text-white"
              >
                <Icon name={s.ikon} size={17} />
              </a>
            ))}
          </div>
        </div>
        {sutunlar.map((k) => (
          <FooterBolum key={k.baslik} baslik={k.baslik}>
            {k.linkler.map((l) => {
                const isaret = (
                  <Icon
                    name={l.ikon ?? "plus"}
                    size={l.ikon ? 15 : 13}
                    strokeWidth={l.ikon ? 1.7 : 1.5}
                    // İkon rengi SABİT. Bağlantıyla birlikte maviye dönüyordu;
                    // iletişim sütununda beş satır birden renk değiştirince
                    // liste, üzerinde gezinen imleci takip eden bir ışık
                    // şeridine dönüşüyordu.
                    className="mt-[3px] flex-none text-white/70"
                  />
                );
                const govde = (
                  <>
                    {isaret}
                    <span className="min-w-0 break-words">{l.label}</span>
                  </>
                );
                const stil =
                  "group flex items-start gap-[10px] text-[14.5px] leading-[1.4] text-white/65 transition hover:text-white";

                if (!l.href) {
                  return (
                    <span key={l.label} className={`${stil} hover:text-white/45`}>
                      {isaret}
                      <span className="min-w-0 break-words text-white/45">{l.label}</span>
                    </span>
                  );
                }
                return l.dis ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noreferrer"
                    className={stil}
                  >
                    {govde}
                  </a>
                ) : (
                  <Link key={l.label} href={l.href} className={stil}>
                    {govde}
                  </Link>
                );
            })}
          </FooterBolum>
        ))}
      </div>
      {/* Telif ve yasal bağlantılar da sola yaslı; dar ekranda alt alta,
          geniş ekranda iki uca yaslanıyor. */}
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 border-t border-white/10 px-5 py-[22px] pb-10 text-[13px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        <span className="order-2 text-center text-white/45 sm:order-1 sm:text-left sm:text-inherit">
          © 2021–2026 Ahmet Ekinci Akademi. Tüm hakları saklıdır.
        </span>
        <div className="order-1 flex flex-wrap gap-x-[22px] gap-y-[10px] sm:order-2">
          {YASAL_LINKLER.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/55 hover:text-white">
              {l.label}
            </Link>
          ))}
          {olcumlemeVar && <CerezTercihleriDugmesi className="text-white/55 hover:text-white" />}
        </div>
      </div>
    </footer>
  );
}
