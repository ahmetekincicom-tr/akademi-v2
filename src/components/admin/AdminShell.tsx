"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/admin/logout-action";

type MenuItem = { href: string; label: string; icon: string; badge?: string };
type MenuGroup = { title: string; items: MenuItem[] };

const groups: MenuGroup[] = [
  { title: "Özet", items: [{ href: "/admin", label: "Genel bakış", icon: "◧" }] },
  {
    title: "Katılımcılar",
    items: [
      { href: "/admin/ogrenciler", label: "Öğrenciler", icon: "◉", badge: "142" },
      { href: "/admin/destek", label: "Destek talepleri", icon: "✉", badge: "2" },
      { href: "/admin/seanslar", label: "Seans takvimi", icon: "◷" },
    ],
  },
  {
    title: "İçerik",
    items: [
      { href: "/admin/egitimler", label: "Eğitimler", icon: "▤" },
      { href: "/admin/video", label: "Video kütüphanesi", icon: "▶", badge: "1" },
      { href: "/admin/dokumanlar", label: "Dokümanlar", icon: "▣" },
    ],
  },
  {
    title: "Finans & sistem",
    items: [
      { href: "/admin/odemeler", label: "Ödemeler", icon: "₺", badge: "1" },
      { href: "/admin/entegrasyonlar", label: "Entegrasyonlar", icon: "⛓" },
      { href: "/admin/ayarlar", label: "Ayarlar", icon: "◐" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Genel bakış",
  "/admin/ogrenciler": "Öğrenciler",
  "/admin/egitimler": "Eğitimler",
  "/admin/odemeler": "Ödemeler",
  "/admin/destek": "Destek talepleri",
  "/admin/dokumanlar": "Dokümanlar",
  "/admin/seanslar": "Seans takvimi",
  "/admin/video": "Video kütüphanesi",
  "/admin/entegrasyonlar": "Entegrasyonlar",
  "/admin/ayarlar": "Ayarlar",
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = pathname.startsWith("/admin/egitimler/") ? "Eğitim düzenle" : (pageTitles[pathname] ?? "Yönetim");

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-[250px] flex-none flex-col bg-ink text-white/64">
        <div className="border-b border-white/9 p-5 pt-5 pb-[18px]">
          <div className="flex items-center gap-[11px] text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold">
              AE
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="font-heading text-sm font-semibold">Akademi Yönetim</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-white/42 uppercase">Admin</span>
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-[14px] overflow-auto px-3 pt-[14px] pb-2">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-[3px]">
              <div className="px-3 pb-[7px] font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase">{g.title}</div>
              {g.items.map((m) => {
                const active = isActive(pathname, m.href);
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="flex items-center gap-[11px] rounded-[9px] border-l-2 px-3 py-[9px] text-[13.5px] font-medium transition hover:bg-white/7 hover:text-white"
                    style={{
                      borderColor: active ? "#1C56F3" : "transparent",
                      background: active ? "rgba(28,86,243,0.16)" : "transparent",
                      color: active ? "#FFFFFF" : "rgba(255,255,255,0.62)",
                    }}
                  >
                    <span className="w-[17px] flex-none font-mono text-[11.5px] opacity-70">{m.icon}</span>
                    <span className="flex-1">{m.label}</span>
                    {m.badge && (
                      <span className="rounded-full bg-brand/24 px-[7px] py-[2px] font-mono text-[9.5px] text-[#A9C0FF]">
                        {m.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-[10px] border-t border-white/9 p-[18px] px-[18px] py-4">
          <span className="avatar-block-dark h-[30px] w-[30px] flex-none rounded-full" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-white">Ahmet Ekinci</span>
            <span className="block font-mono text-[9.5px] text-white/42">Yönetici</span>
          </span>
          <Link
            href="/panel"
            className="font-mono text-[9.5px] tracking-[0.1em] text-white/50 uppercase hover:text-white"
          >
            Öğrenci
          </Link>
        </div>
        <form action={cikisYap} className="border-t border-white/9 px-[18px] py-3">
          <button type="submit" className="font-mono text-[9.5px] tracking-[0.1em] text-white/40 uppercase hover:text-white">
            Çıkış yap
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-ink/9 bg-paper/92 backdrop-blur-[14px]">
          <div className="flex h-[66px] items-center justify-between gap-5 px-7">
            <div className="flex items-center gap-[11px] font-mono text-[10.5px] tracking-[0.08em] text-[#8A8F9E]">
              <span>Yönetim</span>
              <span>/</span>
              <span className="text-ink">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-9 w-[300px] items-center gap-[9px] rounded-[9px] border border-ink/12 bg-white py-0 pr-3 pl-[13px] sm:flex">
                <span className="font-mono text-xs text-[#9CA1AE]">⌕</span>
                <input
                  type="text"
                  placeholder="Öğrenci, işlem no veya talep ara"
                  className="w-full border-0 bg-transparent text-[13px] text-ink outline-none"
                />
                <span className="flex-none rounded-[5px] border border-ink/12 px-[5px] py-[2px] font-mono text-[9.5px] text-[#9CA1AE]">
                  ⌘K
                </span>
              </div>
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-[9px] border border-ink/12 bg-white text-[13px] text-[#3A3F4F] hover:border-brand hover:text-brand"
              >
                ✉
                <span className="animate-pulse-dot absolute top-[7px] right-[8px] h-[7px] w-[7px] rounded-full bg-brand" />
              </button>
              <Link
                href="/admin/egitimler/yeni"
                className="inline-flex h-9 items-center rounded-[9px] bg-ink px-[15px] text-[13.5px] font-semibold text-white hover:bg-brand"
              >
                + Yeni eğitim
              </Link>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
