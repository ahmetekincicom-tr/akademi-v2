"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/admin/logout-action";
import { initials } from "@/lib/admin/shared";
import { Icon, type IconName } from "@/components/Icon";
import { Breadcrumb, type BreadcrumbAdim } from "@/components/Breadcrumb";

export type AdminSayilar = {
  ogrenci: number;
  talep: number;
  odeme: number;
  video: number;
  mesaj: number;
  gorusme: number;
};

type MenuItem = { href: string; label: string; icon: IconName; sayac?: keyof AdminSayilar };
type MenuGroup = { title: string; items: MenuItem[] };

const groups: MenuGroup[] = [
  { title: "Özet", items: [{ href: "/admin", label: "Genel bakış", icon: "grid" }] },
  {
    title: "Katılımcılar",
    items: [
      { href: "/admin/ogrenciler", label: "Öğrenciler", icon: "users", sayac: "ogrenci" },
      { href: "/admin/destek", label: "Destek talepleri", icon: "message", sayac: "talep" },
      { href: "/admin/mesajlar", label: "Gelen mesajlar", icon: "external", sayac: "mesaj" },
      { href: "/admin/birebir-egitim", label: "Birebir eğitim", icon: "book" },
      { href: "/admin/seanslar", label: "Seans takvimi", icon: "calendar" },
      { href: "/admin/gorusmeler", label: "Danışmanlık talepleri", icon: "clock", sayac: "gorusme" },
    ],
  },
  {
    title: "İçerik",
    items: [
      { href: "/admin/egitimler", label: "Eğitimler", icon: "book" },
      { href: "/admin/video", label: "Video kütüphanesi", icon: "playCircle", sayac: "video" },
      { href: "/admin/dokumanlar", label: "Dokümanlar", icon: "folder" },
      { href: "/admin/yorumlar", label: "Katılımcı yorumları", icon: "message" },
      { href: "/admin/referanslar", label: "Referans logoları", icon: "sparkle" },
      { href: "/admin/yasal", label: "Yasal metinler", icon: "file" },
      { href: "/admin/marka", label: "Logo ve favicon", icon: "sparkle" },
      { href: "/admin/site-icerik", label: "Duyuru ve eğitmen", icon: "user" },
    ],
  },
  {
    title: "Finans & sistem",
    items: [
      { href: "/admin/odemeler", label: "Ödemeler", icon: "card", sayac: "odeme" },
      { href: "/admin/bildirimler", label: "Push bildirimler", icon: "bell" },
      { href: "/admin/entegrasyonlar", label: "Entegrasyonlar", icon: "plug" },
      { href: "/admin/ayarlar", label: "Ayarlar", icon: "sliders" },
      { href: "/admin/tani", label: "Sistem tanılama", icon: "shield" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Genel bakış",
  "/admin/ogrenciler": "Öğrenciler",
  "/admin/egitimler": "Eğitimler",
  "/admin/odemeler": "Ödemeler",
  "/admin/bildirimler": "Push bildirimler",
  "/admin/destek": "Destek talepleri",
  "/admin/mesajlar": "Gelen mesajlar",
  "/admin/dokumanlar": "Dokümanlar",
  "/admin/yorumlar": "Katılımcı yorumları",
  "/admin/referanslar": "Referans logoları",
  "/admin/yasal": "Yasal metinler",
  "/admin/marka": "Logo ve favicon",
  "/admin/site-icerik": "Duyuru ve eğitmen",
  "/admin/birebir-egitim": "Birebir eğitim",
  "/admin/seanslar": "Seans takvimi",
  "/admin/gorusmeler": "Danışmanlık talepleri",
  "/admin/video": "Video kütüphanesi",
  "/admin/entegrasyonlar": "Entegrasyonlar",
  "/admin/ayarlar": "Ayarlar",
  "/admin/tani": "Sistem tanılama",
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function breadcrumbAdimlari(pathname: string): BreadcrumbAdim[] {
  if (pathname === "/admin") return [{ label: "Yönetim" }];

  const kok: BreadcrumbAdim = { label: "Yönetim", href: "/admin" };

  // The course editor sits one level under the course list.
  if (pathname.startsWith("/admin/egitimler/")) {
    return [
      kok,
      { label: "Eğitimler", href: "/admin/egitimler" },
      { label: pathname.endsWith("/yeni") ? "Yeni eğitim" : "Eğitim düzenle" },
    ];
  }

  return [kok, { label: pageTitles[pathname] ?? "Sayfa" }];
}

export function AdminShell({
  children,
  isim,
  email,
  sayilar,
}: {
  children: React.ReactNode;
  isim: string;
  email: string;
  sayilar: AdminSayilar;
}) {
  const pathname = usePathname();
  const [menuAcik, setMenuAcik] = useState(false);

  return (
    <div className="flex min-h-screen bg-paper">
      {menuAcik && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMenuAcik(false)}
          className="fixed inset-0 z-40 bg-ink/55 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[250px] flex-none flex-col bg-ink text-white/64 transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          menuAcik ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/9 px-5 pt-5 pb-[18px]">
          <Link href="/admin" className="flex items-center gap-[11px] text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold">
              AE
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="font-heading text-sm font-semibold">Akademi Yönetim</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-white/55 uppercase">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setMenuAcik(false)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <nav className="flex flex-col gap-[14px] overflow-auto px-3 pt-[14px] pb-2">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-[2px]">
              <div className="px-3 pb-[7px] font-mono text-[9px] tracking-[0.2em] text-white/55 uppercase">{g.title}</div>
              {g.items.map((m) => {
                const active = isActive(pathname, m.href);
                const sayi = m.sayac ? sayilar[m.sayac] : 0;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuAcik(false)}
                    className="flex items-center gap-[11px] rounded-[9px] border-l-2 px-3 py-[9px] text-[13.5px] font-medium transition hover:bg-white/[0.07] hover:text-white"
                    style={{
                      borderColor: active ? "#1C56F3" : "transparent",
                      background: active ? "rgba(28,86,243,0.16)" : "transparent",
                      color: active ? "#FFFFFF" : "rgba(255,255,255,0.62)",
                    }}
                  >
                    <Icon name={m.icon} size={16} className="flex-none opacity-80" />
                    <span className="flex-1 truncate">{m.label}</span>
                    {sayi > 0 && (
                      <span className="flex-none rounded-full bg-brand/24 px-[7px] py-[2px] font-mono text-[9.5px] text-[#A9C0FF]">
                        {sayi}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/9 px-[18px] py-4">
          <div className="flex items-center gap-[10px]">
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-brand/25 font-mono text-[10px] font-semibold text-[#A9C0FF]">
              {initials(isim)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">{isim}</span>
              <span className="block truncate font-mono text-[9.5px] text-white/55">{email}</span>
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/panel"
              className="flex h-9 flex-1 items-center justify-center gap-[6px] rounded-[9px] border border-white/12 text-[12.5px] font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <Icon name="user" size={14} />
              Öğrenci
            </Link>
            <form action={cikisYap} className="flex-1">
              <button
                type="submit"
                className="flex h-9 w-full items-center justify-center gap-[6px] rounded-[9px] border border-[#E5484D]/35 text-[12.5px] font-semibold text-[#FF9A9D] transition hover:border-[#E5484D] hover:bg-[#E5484D] hover:text-white"
              >
                <Icon name="logout" size={14} />
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-ink/9 bg-paper/92 backdrop-blur-[14px]">
          <div className="flex h-[66px] items-center justify-between gap-3 px-4 sm:gap-5 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Menüyü aç"
                onClick={() => setMenuAcik(true)}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] border border-ink/13 bg-white text-ink transition hover:border-brand hover:text-brand lg:hidden"
              >
                <Icon name="menu" size={17} />
              </button>
              <Breadcrumb adimlar={breadcrumbAdimlari(pathname)} />
            </div>
            <Link
              href="/admin/egitimler/yeni"
              aria-label="Yeni eğitim"
              className="inline-flex h-9 flex-none items-center gap-[6px] rounded-[9px] bg-ink px-[11px] text-[13.5px] font-semibold text-white transition hover:bg-brand sm:px-[15px]"
            >
              <Icon name="plus" size={15} />
              <span className="hidden sm:inline">Yeni eğitim</span>
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
