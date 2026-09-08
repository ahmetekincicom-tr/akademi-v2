import Link from "next/link";
import { Logo } from "./Logo";
import { MobilMenu } from "./MobilMenu";
import { AktifNav } from "./AktifNav";
import { BaslikKabugu } from "./BaslikKabugu";
import { siteNav } from "./siteNav";
import { ON_YUZ_ACIK } from "@/proxy";

export type { NavItem } from "./siteNav";

/**
 * Sunucu bileşeni olarak kalıyor: <Logo> async ve yüklenen marka görselini
 * okuyor. Bu dosyaya "use client" konsaydı tarayıcı paketine girer, hydrate
 * olamaz ve başlık görünür ama hiçbir şeye tepki vermezdi. Mobil menü ve aktif
 * bağlantı vurgusu kendi istemci bileşenlerinde duruyor.
 */
export function PublicHeader({ logoHref = "/" }: { logoHref?: string }) {
  // Ön yüz kapalıyken menü basılmıyor. Başlık yine de görünüyor çünkü yasal
  // metin sayfaları açık kalıyor; ama oradaki menüdeki her bağlantı giriş
  // ekranına yönlendirilirdi ve okuyan kişi çıkmaza girerdi.
  const menu = ON_YUZ_ACIK;
  const logoAdres = ON_YUZ_ACIK ? logoHref : "/giris";

  return (
    <BaslikKabugu>
      {/*
        Üç sütun: logo | menü | üye girişi.
        justify-between ile menü ortada DURMUYOR — logo ve düğme farklı
        genişliklerde olduğu için menü sürekli bir yana kayıyor. Yanlardaki iki
        sütunun 1fr olması ortadakini alanın gerçek ortasına oturtuyor.
      */}
      <div className="mx-auto grid min-h-[74px] max-w-[1240px] py-2.5 grid-cols-[auto_1fr] items-center gap-6 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
        {/*
          İki logo: beyaz başlıkta koyu (açık zemin) logo, saydam başlıkta açık
          (koyu zemin) logo. CSS data-saydam'a göre birini gizliyor; ikisi de
          "/" bağlantısı ama gizli olan display:none olduğu için erişilebilirlik
          ağacına girmiyor.
        */}
        <div className="flex items-center">
          <span className="baslik-logo-acik">
            <Logo href={logoAdres} variant="dark" />
          </span>
          <span className="baslik-logo-koyu">
            <Logo href={logoAdres} variant="light" />
          </span>
        </div>

        {menu ? (
          <nav className="hidden items-center justify-center gap-[6px] lg:flex">
            <AktifNav items={siteNav} />
          </nav>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="hidden justify-end lg:flex">
          <Link
            href="/giris"
            className="inline-flex h-10 items-center gap-[7px] rounded-[9px] bg-brand px-[18px] text-sm font-semibold text-white shadow-[0_6px_18px_rgba(28,86,243,0.28)] transition hover:bg-ink hover:shadow-[0_6px_18px_rgba(10,13,24,0.25)]"
          >
            Üye girişi
          </Link>
        </div>

        <div className="flex justify-end lg:hidden">
          {menu ? (
            <MobilMenu nav={siteNav} />
          ) : (
            <Link
              href="/giris"
              className="inline-flex h-10 items-center rounded-[9px] bg-brand px-[16px] text-sm font-semibold text-white"
            >
              Üye girişi
            </Link>
          )}
        </div>
      </div>
    </BaslikKabugu>
  );
}
