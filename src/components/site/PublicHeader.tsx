import Link from "next/link";
import { Logo } from "./Logo";
import { MobilMenu } from "./MobilMenu";
import { AktifNav } from "./AktifNav";
import { siteNav } from "./siteNav";

export type { NavItem } from "./siteNav";

/**
 * Sunucu bileşeni olarak kalıyor: <Logo> async ve yüklenen marka görselini
 * okuyor. Bu dosyaya "use client" konsaydı tarayıcı paketine girer, hydrate
 * olamaz ve başlık görünür ama hiçbir şeye tepki vermezdi. Mobil menü ve aktif
 * bağlantı vurgusu kendi istemci bileşenlerinde duruyor.
 */
export function PublicHeader({ logoHref = "/" }: { logoHref?: string }) {
  return (
    <header className="sticky top-0 z-60 border-b border-ink/9 bg-white/90 yapiskan-baslik">
      {/*
        Üç sütun: logo | menü | üye girişi.
        justify-between ile menü ortada DURMUYOR — logo ve düğme farklı
        genişliklerde olduğu için menü sürekli bir yana kayıyor. Yanlardaki iki
        sütunun 1fr olması ortadakini alanın gerçek ortasına oturtuyor.
      */}
      <div className="mx-auto grid h-[74px] max-w-[1240px] grid-cols-[auto_1fr] items-center gap-6 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
        <Logo href={logoHref} />

        <nav className="hidden items-center justify-center gap-[6px] lg:flex">
          <AktifNav items={siteNav} />
        </nav>

        <div className="hidden justify-end lg:flex">
          <Link
            href="/giris"
            className="inline-flex h-10 items-center gap-[7px] rounded-[9px] bg-brand px-[18px] text-sm font-semibold text-white shadow-[0_6px_18px_rgba(28,86,243,0.28)] transition hover:bg-ink hover:shadow-[0_6px_18px_rgba(10,13,24,0.25)]"
          >
            Üye girişi
          </Link>
        </div>

        <div className="flex justify-end lg:hidden">
          <MobilMenu nav={siteNav} />
        </div>
      </div>
    </header>
  );
}
