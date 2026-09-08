"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useBaslikSaydam } from "./BaslikKabugu";
import type { NavItem } from "./siteNav";

/**
 * Menü bağlantıları ve bulunduğun sayfanın vurgusu.
 *
 * Ayrı bir istemci bileşeni: PublicHeader sunucuda kalmak zorunda (async Logo)
 * ama hangi sayfada olduğumuzu bilmek için usePathname gerekiyor.
 */
export function AktifNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // Saydam başlık (ana sayfa üstü) koyu zemin üzerinde: yazılar açık renk.
  const saydam = useBaslikSaydam();

  return (
    <>
      {items.map((item) => {
        // Ana sayfa tam eşleşme ister; "/" her yolun başında yer aldığı için
        // startsWith kullanılsaydı bütün sayfalarda aktif görünürdü.
        const aktif = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={aktif ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-[7px] rounded-[9px] px-[13px] text-[14.5px] font-medium transition-colors ${
              saydam ? "hover:bg-white/10 hover:text-white" : "hover:bg-mist hover:text-brand"
            }`}
            style={{
              color: saydam
                ? aktif
                  ? "#FFFFFF"
                  : "rgba(255,255,255,0.82)"
                : aktif
                  ? "#1C56F3"
                  : "#3A3F4F",
              background: aktif
                ? saydam
                  ? "rgba(255,255,255,0.14)"
                  : "rgba(28,86,243,0.08)"
                : undefined,
            }}
          >
            <Icon name={item.icon} size={16} className="flex-none opacity-85" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
