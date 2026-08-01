"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { NavItem } from "./PublicHeader";

/**
 * Only the toggle and the panel live on the client. PublicHeader itself stays
 * a server component because it renders <Logo>, which is async and cannot
 * hydrate if it is pulled into the browser bundle.
 */
export function MobilMenu({
  nav,
  ctaLabel,
  ctaHref,
}: {
  nav: NavItem[];
  ctaLabel: string;
  ctaHref: string;
}) {
  const [acik, setAcik] = useState(false);
  const kapat = () => setAcik(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-label={acik ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={acik}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] border border-ink/14 text-ink transition hover:border-brand hover:text-brand lg:hidden"
      >
        <Icon name={acik ? "x" : "menu"} size={18} />
      </button>

      {acik && (
        <div className="absolute inset-x-0 top-full border-t border-ink/9 bg-white shadow-[0_18px_40px_rgba(10,13,24,0.12)] lg:hidden">
          <div className="mx-auto flex max-w-[1240px] flex-col px-5 py-3 sm:px-8">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={kapat}
                className="border-b border-ink/7 py-[13px] text-[15.5px] font-medium text-[#3A3F4F]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 mb-2 flex flex-col gap-[10px]">
              <Link
                href={ctaHref}
                onClick={kapat}
                className="inline-flex h-12 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-semibold text-white"
              >
                {ctaLabel}
              </Link>
              <Link
                href="/giris"
                onClick={kapat}
                className="inline-flex h-12 items-center justify-center rounded-[10px] border border-ink/14 px-5 text-[15px] font-semibold text-ink"
              >
                Üye girişi
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
