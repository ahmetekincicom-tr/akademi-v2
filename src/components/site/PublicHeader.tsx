import Link from "next/link";
import { Logo } from "./Logo";
import { MobilMenu } from "./MobilMenu";

export type NavItem = { label: string; href: string };

/**
 * Stays a server component: <Logo> is async and reads the uploaded brand mark,
 * so marking this file "use client" would drag it into the browser bundle where
 * it cannot hydrate — and the header would render but never respond. The mobile
 * toggle lives in its own client component instead.
 */
export function PublicHeader({
  nav,
  ctaLabel,
  ctaHref,
  logoHref = "/",
}: {
  nav: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  logoHref?: string;
}) {
  return (
    <header className="sticky top-0 z-60 border-b border-ink/9 bg-white/90 yapiskan-baslik">
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between gap-8 px-5 sm:px-8">
        <Logo href={logoHref} />

        <nav className="hidden items-center gap-[26px] lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14.5px] font-medium text-[#3A3F4F] hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
          <div className="h-[22px] w-px bg-ink/12" />
          <Link
            href="/giris"
            className="inline-flex h-10 items-center rounded-[9px] border border-ink/14 px-[15px] text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Üye girişi
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex h-10 items-center rounded-[9px] bg-brand px-[18px] text-sm font-semibold text-white shadow-[0_6px_18px_rgba(28,86,243,0.28)] hover:bg-ink hover:shadow-[0_6px_18px_rgba(10,13,24,0.25)]"
          >
            {ctaLabel}
          </Link>
        </nav>

        <MobilMenu nav={nav} ctaLabel={ctaLabel} ctaHref={ctaHref} />
      </div>
    </header>
  );
}
