"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/panel/actions";
import type { PanelProfile } from "@/lib/panel";

type MenuItem = { href: string; label: string; icon: string };
type MenuGroup = { title: string; items: MenuItem[] };

const groups: MenuGroup[] = [
  {
    title: "Öğrenme",
    items: [
      { href: "/panel", label: "Genel bakış", icon: "◧" },
      { href: "/panel/dersler", label: "Derslerim", icon: "▶" },
      { href: "/panel/dokumanlar", label: "Doküman kütüphanesi", icon: "▤" },
    ],
  },
  {
    title: "Destek",
    items: [
      { href: "/panel/seanslar", label: "Birebir seanslar", icon: "◷" },
      { href: "/panel/soru-cevap", label: "Soru-cevap", icon: "✉" },
    ],
  },
  {
    title: "Hesap",
    items: [
      { href: "/panel/yeni-egitimler", label: "Yeni eğitimler", icon: "◈" },
      { href: "/panel/hesabim", label: "Hesabım", icon: "◐" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/panel": "Genel bakış",
  "/panel/dersler": "Ders izleme",
  "/panel/dokumanlar": "Doküman kütüphanesi",
  "/panel/seanslar": "Birebir seanslar",
  "/panel/soru-cevap": "Soru-cevap",
  "/panel/yeni-egitimler": "Yeni eğitimler",
  "/panel/hesabim": "Hesabım",
};

export function PanelShell({
  children,
  profil,
  aktifProgram,
  programSayisi,
}: {
  children: React.ReactNode;
  profil: PanelProfile;
  aktifProgram: { baslik: string; slug: string } | null;
  programSayisi: number;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Panel";

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 flex h-screen w-[264px] flex-none flex-col bg-ink text-white/66">
        <div className="border-b border-white/10 p-[22px] px-[22px] pt-[22px] pb-5">
          <Link href="/" className="flex items-center gap-[11px] text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold">
              AE
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="font-heading text-sm font-semibold">Ahmet Ekinci</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase">Öğrenci paneli</span>
            </span>
          </Link>
        </div>

        <div className="border-b border-white/8 p-[18px] px-[18px] pt-4 pb-[14px]">
          {aktifProgram ? (
            <Link
              href="/panel/dersler"
              className="flex w-full items-center gap-[11px] rounded-[11px] border border-white/12 bg-white/4 p-[11px] px-3 text-left hover:border-brand/60"
            >
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] bg-brand/20 font-mono text-[11px] text-[#7FA0FF]">
                ▶
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] tracking-[0.16em] text-white/42 uppercase">
                  {programSayisi > 1 ? `Aktif program · ${programSayisi} kayıt` : "Aktif program"}
                </span>
                <span className="mt-[3px] block truncate text-[13px] font-semibold text-white">
                  {aktifProgram.baslik}
                </span>
              </span>
            </Link>
          ) : (
            <div className="rounded-[11px] border border-white/12 bg-white/4 p-[11px] px-3">
              <span className="block font-mono text-[9px] tracking-[0.16em] text-white/42 uppercase">
                Aktif program
              </span>
              <span className="mt-[3px] block text-[13px] font-semibold text-white/70">Henüz kayıt yok</span>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-[14px] overflow-auto p-[14px] px-[14px] pt-[14px] pb-2">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-[3px]">
              <div className="px-[13px] pb-[7px] font-mono text-[9px] tracking-[0.2em] text-white/32 uppercase">
                {g.title}
              </div>
              {g.items.map((m) => {
                const active = pathname === m.href;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="flex items-center gap-[11px] rounded-[9px] border-l-2 px-3 py-[10px] text-sm font-medium transition hover:bg-white/7 hover:text-white"
                    style={{
                      borderColor: active ? "#1C56F3" : "transparent",
                      background: active ? "rgba(28,86,243,0.16)" : "transparent",
                      color: active ? "#FFFFFF" : "rgba(255,255,255,0.62)",
                    }}
                  >
                    <span className="w-[18px] flex-none font-mono text-xs opacity-70">{m.icon}</span>
                    <span className="flex-1">{m.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto p-[18px] px-[18px] pt-4 pb-[22px]">
          <div className="flex items-center gap-[10px]">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand/25 font-mono text-[11px] font-semibold text-[#A9C0FF]">
              {profil.basHarfler}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-white">{profil.tamAd}</span>
              <span className="block truncate font-mono text-[10px] text-white/42">{profil.email}</span>
            </span>
          </div>
          <form action={cikisYap}>
            <button
              type="submit"
              className="mt-3 h-9 w-full rounded-[9px] border border-white/12 text-[13px] font-semibold text-white/70 hover:border-white/30 hover:text-white"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-ink/9 bg-paper/90 backdrop-blur-[14px]">
          <div className="flex h-[70px] items-center justify-between gap-6 px-[34px]">
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.08em] text-[#8A8F9E]">
              <span>Panel</span>
              <span>/</span>
              <span className="text-ink">{pageTitle}</span>
            </div>
            <div className="flex items-center gap-[14px]">
              <Link
                href="/panel/soru-cevap"
                className="inline-flex h-[38px] items-center rounded-[9px] bg-ink px-[15px] text-[13.5px] font-semibold text-white hover:bg-brand"
              >
                Destek talebi
              </Link>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
