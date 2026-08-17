import Link from "next/link";
import { Logo } from "./Logo";
import { Icon } from "@/components/Icon";
import { CerezTercihleriDugmesi } from "@/components/site/CerezTercihleriDugmesi";
import { getOlcumleme, olcumlemeAcik } from "@/lib/olcumleme";
import { getCourses } from "@/lib/courses";
import {
  SOSYAL,
  WHATSAPP_NUMARALAR,
  EPOSTA,
  INSTAGRAM_KULLANICI,
  INSTAGRAM_URL,
  SEHIR,
  whatsappLink,
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
        href: whatsappLink(WHATSAPP_NUMARALAR[0].numara),
        dis: true,
        ikon: "whatsapp",
      },
      {
        label: WHATSAPP_NUMARALAR[1].gosterim,
        href: whatsappLink(WHATSAPP_NUMARALAR[1].numara),
        dis: true,
        ikon: "whatsapp",
      },
      { label: EPOSTA, href: `mailto:${EPOSTA}`, dis: true, ikon: "mail" },
      { label: INSTAGRAM_KULLANICI, href: INSTAGRAM_URL, dis: true, ikon: "instagram" },
      { label: SEHIR, ikon: "pin" },
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
  const [olcumleme, egitim] = await Promise.all([getOlcumleme(), egitimSutunu()]);
  const olcumlemeVar = olcumlemeAcik(olcumleme);

  // Eğitim sütunu "Akademi"den sonra, "İletişim"den önce duruyordu.
  const sutunlar = [footerColumns[0], egitim, ...footerColumns.slice(1)];

  return (
    <footer className="border-t border-white/10 bg-ink text-white/60">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-5 sm:px-8 py-16 pb-7 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo variant="light" />
          <p className="mt-[18px] max-w-[280px] text-[14.5px] leading-[1.65]">
            Dijital çağın dinamiklerine uygun, birebir eğitim deneyimi. Ankara ve online.
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
          <div key={k.baslik}>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-white/55 uppercase">{k.baslik}</div>
            <div className="mt-[18px] flex flex-col gap-[11px]">
              {k.linkler.map((l) => {
                const isaret = (
                  <Icon
                    name={l.ikon ?? "plus"}
                    size={l.ikon ? 15 : 13}
                    strokeWidth={l.ikon ? 1.7 : 1.5}
                    className="mt-[3px] flex-none text-white/55 transition group-hover:text-brand"
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
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 border-t border-white/10 px-5 sm:px-8 py-[22px] pb-10 text-[13px]">
        <span>© 2021–2026 Ahmet Ekinci Akademi. Tüm hakları saklıdır.</span>
        <div className="flex flex-wrap gap-x-[22px] gap-y-2">
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
