"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SOSYAL } from "@/lib/iletisim";
import { useBaslikSaydam } from "./BaslikKabugu";
import type { NavItem } from "./siteNav";

/**
 * Mobil menü — sağdan açılan kayar panel (drawer).
 *
 * Başlıktaki hamburger düğmesine basınca sağ taraftan bir panel kayarak
 * açılıyor. Yalnızca düğme ve panel istemcide; PublicHeader sunucu bileşeni
 * olarak kalıyor (async <Logo>).
 *
 * Logo PROP olarak geliyor, burada çizilmiyor: <Logo> async bir sunucu
 * bileşeni ve yüklenen marka görselini okuyor. Bu dosya "use client" olduğu
 * için onu içeriden çağıramaz; sunucuda çizilip hazır bir element olarak
 * aktarılıyor.
 */
export function MobilMenu({ nav, logo }: { nav: NavItem[]; logo?: React.ReactNode }) {
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
          className={`absolute inset-0 bg-ink/50 backdrop-blur-[3px] transition-opacity duration-300 ${
            acik ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menü"
          /*
            h-dvh (h-full değil): iOS'ta tarayıcı çubukları hesaba katılmıyor
            ve panelin altı ekrandan taşıyordu — alttaki düğmeler kesiliyordu.
            Zeminde çok hafif bir degrade var; düz beyaz yüzeye göre daha
            katmanlı duruyor.
          */
          className={`absolute top-0 right-0 flex h-dvh w-[88%] max-w-[360px] flex-col bg-gradient-to-b from-white via-white to-[#F3F5FA] shadow-[-24px_0_60px_rgba(10,13,24,0.26)] transition-transform duration-300 ease-out ${
            acik ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Üst: marka + kapat. Çentikli telefonlarda üst güvenli alan kadar
              ek boşluk alıyor, yoksa logo durum çubuğunun altına giriyor. */}
          <div className="flex flex-none items-center justify-between gap-3 border-b border-ink/8 px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-[18px]">
            <div className="min-w-0">{logo}</div>
            <button
              type="button"
              onClick={kapat}
              aria-label="Menüyü kapat"
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink/[0.06] text-ink transition hover:bg-ink hover:text-white"
            >
              <Icon name="x" size={17} />
            </button>
          </div>

          {/*
            min-h-0 + flex-1: flex çocuğu varsayılan olarak içeriğinin altına
            küçülmüyor; bu ikisi olmadan liste uzadığında alttaki düğmeleri
            aşağı itip ekran dışına çıkarıyor.
          */}
          <div className="panel-menu-liste min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5">
            <div className="px-1 pb-3 font-mono text-[10.5px] tracking-[0.2em] text-[#8A90A0] uppercase">Menü</div>

            <nav className="flex flex-col gap-2">
              {nav.map((item) => {
                const aktif = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={kapat}
                    aria-current={aktif ? "page" : undefined}
                    /*
                      Satır değil kart: her başlık kendi zeminine oturuyor,
                      dokunma alanı da büyüyor (54px). Seçili olan marka
                      rengiyle dolduruluyor, ayrıca sağdaki ok beliriyor.
                    */
                    className={`group flex items-center gap-[13px] rounded-[14px] border px-[15px] py-[15px] text-[15.5px] font-semibold transition ${
                      aktif
                        ? "border-brand/25 bg-brand/[0.08] text-brand"
                        : "border-ink/8 bg-ink/[0.025] text-[#2B3040] hover:border-brand/25 hover:bg-brand/[0.05] hover:text-brand"
                    }`}
                  >
                    <Icon name={item.icon} size={18} className="flex-none opacity-70" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <Icon
                      name="chevronRight"
                      size={16}
                      className={`flex-none transition ${aktif ? "text-brand" : "text-[#B4B9C6] group-hover:text-brand"}`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Alt blok: birincil eylem, ikincil eylem, sosyal, telif. */}
          <div className="flex-none border-t border-ink/8 px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <Link
              href="/giris"
              onClick={kapat}
              className="inline-flex h-[52px] w-full items-center justify-center gap-[9px] rounded-full bg-brand px-5 text-[15.5px] font-semibold text-white shadow-[0_10px_26px_-8px_rgba(28,86,243,0.7)] transition hover:bg-ink hover:shadow-[0_10px_26px_-8px_rgba(10,13,24,0.55)]"
            >
              <Icon name="user" size={17} />
              Üye girişi
            </Link>

            <Link
              href="/kayit"
              onClick={kapat}
              className="mt-2 inline-flex h-[46px] w-full items-center justify-center rounded-full border border-ink/14 text-[15px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
            >
              Kayıt ol
            </Link>

            {/* Sosyal adresler lib/iletisim'deki tek kaynaktan (SOSYAL) geliyor;
                footer da aynı listeyi kullanıyor. */}
            <div className="mt-[18px] flex items-center justify-center gap-2.5">
              {SOSYAL.map((s) => (
                <a
                  key={s.ad}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.ad}
                  title={s.ad}
                  onClick={kapat}
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-ink/12 text-[#5C6273] transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  <Icon name={s.ikon} size={17} />
                </a>
              ))}
            </div>

            <p className="mt-[14px] text-center font-mono text-[10.5px] text-[#8A90A0]">
              © {new Date().getFullYear()} Ahmet Ekinci Akademi
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
