"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useBaslikSaydam } from "./BaslikKabugu";
import type { NavItem } from "./siteNav";

/**
 * Mobil menü — sağdan açılan kayar panel (drawer).
 *
 * Başlıktaki hamburger düğmesine basınca sağ taraftan bir panel kayarak açılıyor;
 * içinde menü bağlantıları ve üye giriş/kayıt düğmeleri var. Yalnızca düğme ve
 * panel istemcide; PublicHeader sunucu bileşeni olarak kalıyor (async <Logo>).
 */
export function MobilMenu({ nav }: { nav: NavItem[] }) {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();
  const kapat = () => setAcik(false);
  // Saydam başlıkta (ana sayfa üstü) hamburger açık renk.
  const saydam = useBaslikSaydam();

  // Panel açıkken arka planın kaymasını engelle.
  useEffect(() => {
    if (!acik) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = eski;
    };
  }, [acik]);

  // ESC ile kapat.
  useEffect(() => {
    if (!acik) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [acik]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAcik(true)}
        aria-label="Menüyü aç"
        aria-expanded={acik}
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-[10px] border transition lg:hidden ${
          saydam ? "border-white/25 text-white hover:border-white" : "border-ink/14 text-ink hover:border-brand hover:text-brand"
        }`}
      >
        <Icon name="menu" size={18} />
      </button>

      {/*
        Kaplama her zaman DOM'da; açık/kapalı geçişi opacity + translate ile,
        böylece hem açılış hem kapanış yumuşak. Kapalıyken pointer-events yok.
      */}
      <div className={`fixed inset-0 z-[70] lg:hidden ${acik ? "" : "pointer-events-none"}`} aria-hidden={!acik}>
        <div
          onClick={kapat}
          className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            acik ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menü"
          className={`absolute top-0 right-0 flex h-full w-[84%] max-w-[340px] flex-col bg-white shadow-[-20px_0_50px_rgba(10,13,24,0.22)] transition-transform duration-300 ${
            acik ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
            <span className="font-mono text-[11px] tracking-[0.16em] text-[#656B7A] uppercase">Menü</span>
            <button
              type="button"
              onClick={kapat}
              aria-label="Menüyü kapat"
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-ink/12 text-ink transition hover:border-ink"
            >
              <Icon name="x" size={17} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {nav.map((item) => {
              const aktif = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={kapat}
                  aria-current={aktif ? "page" : undefined}
                  className="flex items-center gap-[12px] rounded-[10px] px-3 py-[13px] text-[15.5px] font-medium transition-colors hover:bg-mist"
                  style={{ color: aktif ? "#1C56F3" : "#3A3F4F", background: aktif ? "rgba(28,86,243,0.08)" : undefined }}
                >
                  <Icon name={item.icon} size={18} className="flex-none opacity-80" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Üye giriş / kayıt düğmeleri panelin altında. */}
          <div className="flex flex-col gap-2 border-t border-ink/8 px-4 py-4">
            <Link
              href="/giris"
              onClick={kapat}
              className="inline-flex h-12 items-center justify-center gap-[8px] rounded-[10px] bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-ink"
            >
              <Icon name="user" size={17} />
              Üye girişi
            </Link>
            <Link
              href="/kayit"
              onClick={kapat}
              className="inline-flex h-12 items-center justify-center rounded-[10px] border border-ink/14 px-5 text-[15px] font-semibold text-ink transition hover:border-ink"
            >
              Kayıt ol
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
