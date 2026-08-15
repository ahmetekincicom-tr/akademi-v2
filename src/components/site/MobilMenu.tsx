"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { NavItem } from "./siteNav";

/**
 * Yalnızca düğme ve panel istemcide. PublicHeader sunucu bileşeni olarak
 * kalıyor çünkü <Logo> async ve tarayıcı paketine çekilirse hydrate olamıyor.
 */
export function MobilMenu({ nav }: { nav: NavItem[] }) {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();
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
            {nav.map((item) => {
              const aktif = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={kapat}
                  aria-current={aktif ? "page" : undefined}
                  className="flex items-center gap-[11px] border-b border-ink/7 py-[13px] text-[15.5px] font-medium"
                  style={{ color: aktif ? "#1C56F3" : "#3A3F4F" }}
                >
                  <Icon name={item.icon} size={17} className="flex-none opacity-80" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/giris"
              onClick={kapat}
              className="mt-4 mb-2 inline-flex h-12 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-semibold text-white"
            >
              Üye girişi
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
