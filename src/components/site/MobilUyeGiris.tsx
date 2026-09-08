"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useBaslikSaydam } from "./BaslikKabugu";

/**
 * Mobil başlığın solundaki üye girişi ikonu — /giris'e gider.
 * Saydam başlıkta (ana sayfa üstü) açık renk, aksi hâlde koyu.
 */
export function MobilUyeGiris() {
  const saydam = useBaslikSaydam();
  return (
    <Link
      href="/giris"
      aria-label="Üye girişi"
      title="Üye girişi"
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-[10px] border transition lg:hidden ${
        saydam ? "border-white/25 text-white hover:border-white" : "border-ink/14 text-ink hover:border-brand hover:text-brand"
      }`}
    >
      <Icon name="user" size={18} />
    </Link>
  );
}
