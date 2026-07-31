"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/admin/logout-action";
import { initials } from "@/lib/admin/shared";
import { Icon, type IconName } from "@/components/Icon";
import { Breadcrumb, type BreadcrumbAdim } from "@/components/Breadcrumb";

export type AdminSayilar = { ogrenci: number; talep: number; odeme: number; video: number; mesaj: number };

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
      { href: "/admin/seanslar", label: "Seans takvimi", icon: "calendar" },
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
    ],
  },
  {
    title: "Finans & sistem",
    items: [
      { href: "/admin/odemeler", label: "Ödemeler", icon: "card", sayac: "odeme" },
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
  "/admin/destek": "Destek talepleri",
  "/admin/mesajlar": "Gelen mesajlar",
  "/admin/dokumanlar": "Dokümanlar",
  "/admin/yorumlar": "Katılımcı yorumları",
  "/admin/referanslar": "Referans logoları",
  "/admin/yasal": "Yasal metinler",
  "/admin/marka": "Logo ve favicon",
  "/admin/seanslar": "Seans takvimi",
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

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-[250px] flex-none flex-col bg-ink text-white/64">
        <div className="border-b border-white/9 px-5 pt-5 pb-[18px]">
          <Link href="/admin" className="flex items-center gap-[11px] text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold">
              AE
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="font-heading text-sm font-semibold">Akademi Yönetim</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-white/42 uppercase">Admin</span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-col gap-[14px] overflow-auto px-3 pt-[14px] pb-2">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-[2px]">
              <div className="px-3 pb-[7px] font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase">{g.title}</div>
              {g.items.map((m) => {
                const active = isActive(pathname, m.href);
                const sayi = m.sayac ? sayilar[m.sayac] : 0;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    aria-current={active ? "page" : undefined}
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
              <span className="block truncate font-mono text-[9.5px] text-white/42">{email}</span>
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
          <div className="flex h-[66px] items-center justify-between gap-5 px-7">
            <Breadcrumb adimlar={breadcrumbAdimlari(pathname)} />
            <Link
              href="/admin/egitimler/yeni"
              className="inline-flex h-9 flex-none items-center gap-[6px] rounded-[9px] bg-ink px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-brand"
            >
              <Icon name="plus" size={15} />
              Yeni eğitim
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
