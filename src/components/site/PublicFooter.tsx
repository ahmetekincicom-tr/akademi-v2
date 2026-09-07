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

/*
  Ödeme işaretleri.

  Kabul edilen ödeme yöntemlerini gösteriyor; ödeme altyapısı iyzico
  (bkz. lib/iyzico.ts). SVG'ler public/odeme altında, koyu zemine göre tek
  renk. Yükseklikler her işaretin görsel ağırlığı eşit dursun diye ayrı.
*/
const ODEME_ISARETLERI = [
  { ad: "iyzico ile öde", src: "/odeme/iyzico.svg", h: 26 },
  { ad: "Mastercard", src: "/odeme/mastercard.svg", h: 26 },
  { ad: "Visa", src: "/odeme/visa.svg", h: 17 },
  { ad: "American Express", src: "/odeme/amex.svg", h: 24 },
  { ad: "Troy", src: "/odeme/troy.svg", h: 18 },
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
          <p className="mt-5 max-w-[300px] text-[16px] leading-[1.7] text-white/70">
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

          {/* Kommo partner rozeti — sosyal ikonların altında, markanın parçası. */}
          <a
            href="https://www.kommo.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Kommo partner"
            title="Kommo partner"
            className="mt-[22px] inline-flex items-center gap-[11px] rounded-[11px] border border-white/14 bg-white/[0.03] px-[14px] py-[9px] transition hover:border-white/30"
          >
            <span
              className="flex h-[28px] w-[28px] flex-none items-center justify-center rounded-[8px]"
              style={{ background: "#2764E7" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                {/* Sohbet balonu: Kommo bir mesajlaşma/CRM aracı. */}
                <path
                  d="M5 4h14a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-7.6L7 20.4v-3.9H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                  fill="#fff"
                />
              </svg>
            </span>
            <span className="flex flex-col text-left leading-[1.15]">
              <span className="text-[14px] font-semibold text-white">Kommo</span>
              <span className="text-[11px] tracking-[0.02em] text-white/55">partner</span>
            </span>
          </a>
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
      {/*
        Alt bant. Üstte yasal bağlantılar, altında telif + ödeme işaretleri.

        Ödeme işaretleri dar ekranda ortalı, geniş ekranda telifin karşısında
        (sağda) — görseldeki düzen. Yasal bağlantılar dar ekranda ortalı,
        geniş ekranda sağa yaslı ve her birinin başında bir ok işareti —
        eskiden işaretsiz, düzensiz bir satırdı.
      */}
      <div className="mx-auto max-w-[1240px] px-5 pb-10 sm:px-8">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-[10px] border-t border-white/10 pt-[22px] text-[13px] sm:justify-end">
          {YASAL_LINKLER.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group/yasal inline-flex items-center gap-[6px] text-white/55 transition hover:text-white"
            >
              <Icon name="chevronRight" size={13} className="flex-none text-white/35 transition group-hover/yasal:text-brand" />
              {l.label}
            </Link>
          ))}
          {olcumlemeVar && (
            <span className="inline-flex items-center gap-[6px] text-white/35">
              <Icon name="chevronRight" size={13} className="flex-none" />
              <CerezTercihleriDugmesi className="text-white/55 hover:text-white" />
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-5 text-[13px] sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span className="order-2 text-center text-white/45 sm:order-1 sm:text-left">
            © 2021–2026 Ahmet Ekinci Akademi. Tüm hakları saklıdır.
          </span>
          <div className="order-1 flex flex-wrap items-center justify-center gap-x-[22px] gap-y-3 sm:order-2 sm:justify-end">
            {ODEME_ISARETLERI.map((o) => (
              // Yerel SVG; next/image SVG'yi zaten optimize etmiyor.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={o.ad}
                src={o.src}
                alt={o.ad}
                loading="lazy"
                style={{ height: o.h }}
                className="w-auto opacity-90"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
