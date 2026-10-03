"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/kontrol-9f4x2k/logout-action";
import { initials } from "@/lib/admin/shared";
import { Icon, type IconName } from "@/components/Icon";
import { MenuAlt, MenuGrup, MenuMarka, MenuOgesi, YanMenuZemin, YAN_MENU_RENK, YAN_MENU_ZEMIN } from "@/components/YanMenu";
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
  { title: "Özet", items: [{ href: "/kontrol-9f4x2k", label: "Genel bakış", icon: "grid" }] },
  {
    title: "Katılımcılar",
    items: [
      { href: "/kontrol-9f4x2k/ogrenciler", label: "Öğrenciler", icon: "users", sayac: "ogrenci" },
      { href: "/kontrol-9f4x2k/destek", label: "Destek talepleri", icon: "message", sayac: "talep" },
      { href: "/kontrol-9f4x2k/mesajlar", label: "Gelen mesajlar", icon: "external", sayac: "mesaj" },
      { href: "/kontrol-9f4x2k/birebir-egitim", label: "Birebir eğitim", icon: "book" },
      { href: "/kontrol-9f4x2k/seanslar", label: "Takvim", icon: "calendar" },
      { href: "/kontrol-9f4x2k/gorusmeler", label: "Danışmanlık talepleri", icon: "clock", sayac: "gorusme" },
    ],
  },
  {
    title: "İçerik",
    items: [
      { href: "/kontrol-9f4x2k/egitimler", label: "Eğitimler", icon: "book" },
      { href: "/kontrol-9f4x2k/blog", label: "Blog", icon: "file" },
      { href: "/kontrol-9f4x2k/video", label: "Video kütüphanesi", icon: "playCircle", sayac: "video" },
      { href: "/kontrol-9f4x2k/dokumanlar", label: "Dokümanlar", icon: "folder" },
      { href: "/kontrol-9f4x2k/duyurular", label: "Gündem panosu", icon: "bell" },
      { href: "/kontrol-9f4x2k/firsatlar", label: "İş ilanları", icon: "briefcase" },
      { href: "/kontrol-9f4x2k/yorumlar", label: "Katılımcı yorumları", icon: "message" },
      { href: "/kontrol-9f4x2k/referanslar", label: "Referans logoları", icon: "sparkle" },
      { href: "/kontrol-9f4x2k/yasal", label: "Yasal metinler", icon: "file" },
      { href: "/kontrol-9f4x2k/marka", label: "Logo ve favicon", icon: "sparkle" },
      { href: "/kontrol-9f4x2k/site-icerik", label: "Duyuru ve eğitmen", icon: "user" },
      { href: "/kontrol-9f4x2k/hakkimizda", label: "Hakkımızda sayfası", icon: "file" },
      { href: "/kontrol-9f4x2k/kurumsal", label: "Kurumsal sayfası", icon: "users" },
      { href: "/kontrol-9f4x2k/seo", label: "SEO", icon: "eye" },
      { href: "/kontrol-9f4x2k/seo-performans", label: "SEO performansı", icon: "search" },
    ],
  },
  {
    title: "Finans & sistem",
    items: [
      { href: "/kontrol-9f4x2k/odemeler", label: "Ödemeler", icon: "card", sayac: "odeme" },
      { href: "/kontrol-9f4x2k/bildirimler", label: "Push bildirimler", icon: "bell" },
      { href: "/kontrol-9f4x2k/e-postalar", label: "E-posta bildirimleri", icon: "mail" },
      { href: "/kontrol-9f4x2k/meta", label: "Meta ölçümleme", icon: "sparkle" },
      { href: "/kontrol-9f4x2k/google", label: "Google dönüşümleri", icon: "eye" },
      { href: "/kontrol-9f4x2k/entegrasyonlar", label: "Entegrasyonlar", icon: "plug" },
      { href: "/kontrol-9f4x2k/ayarlar", label: "Ayarlar", icon: "sliders" },
      { href: "/kontrol-9f4x2k/tani", label: "Sistem tanılama", icon: "shield" },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/kontrol-9f4x2k": "Genel bakış",
  "/kontrol-9f4x2k/ogrenciler": "Öğrenciler",
  "/kontrol-9f4x2k/ogrenciler/ice-aktar": "Öğrenci içe aktarma",
  "/kontrol-9f4x2k/egitimler": "Eğitimler",
  "/kontrol-9f4x2k/blog": "Blog",
  "/kontrol-9f4x2k/odemeler": "Ödemeler",
  "/kontrol-9f4x2k/bildirimler": "Push bildirimler",
  "/kontrol-9f4x2k/e-postalar": "E-posta bildirimleri",
  "/kontrol-9f4x2k/destek": "Destek talepleri",
  "/kontrol-9f4x2k/mesajlar": "Gelen mesajlar",
  "/kontrol-9f4x2k/dokumanlar": "Dokümanlar",
  "/kontrol-9f4x2k/duyurular": "Gündem panosu",
  "/kontrol-9f4x2k/firsatlar": "İş ilanları",
  "/kontrol-9f4x2k/yorumlar": "Katılımcı yorumları",
  "/kontrol-9f4x2k/referanslar": "Referans logoları",
  "/kontrol-9f4x2k/yasal": "Yasal metinler",
  "/kontrol-9f4x2k/marka": "Logo ve favicon",
  "/kontrol-9f4x2k/site-icerik": "Duyuru ve eğitmen",
  "/kontrol-9f4x2k/hakkimizda": "Hakkımızda sayfası",
  "/kontrol-9f4x2k/seo": "SEO",
  "/kontrol-9f4x2k/seo-performans": "SEO performansı",
  "/kontrol-9f4x2k/birebir-egitim": "Birebir eğitim",
  "/kontrol-9f4x2k/seanslar": "Takvim",
  "/kontrol-9f4x2k/gorusmeler": "Danışmanlık talepleri",
  "/kontrol-9f4x2k/video": "Video kütüphanesi",
  "/kontrol-9f4x2k/meta": "Meta ölçümleme",
  "/kontrol-9f4x2k/google": "Google dönüşümleri",
  "/kontrol-9f4x2k/entegrasyonlar": "Entegrasyonlar",
  "/kontrol-9f4x2k/ayarlar": "Ayarlar",
  "/kontrol-9f4x2k/tani": "Sistem tanılama",
};

function isActive(pathname: string, href: string) {
  if (href === "/kontrol-9f4x2k") return pathname === "/kontrol-9f4x2k";
  return pathname === href || pathname.startsWith(href + "/");
}

function breadcrumbAdimlari(pathname: string): BreadcrumbAdim[] {
  if (pathname === "/kontrol-9f4x2k") return [{ label: "Yönetim" }];

  const kok: BreadcrumbAdim = { label: "Yönetim", href: "/kontrol-9f4x2k" };

  // The course editor sits one level under the course list.
  if (pathname.startsWith("/kontrol-9f4x2k/egitimler/")) {
    return [
      kok,
      { label: "Eğitimler", href: "/kontrol-9f4x2k/egitimler" },
      { label: pathname.endsWith("/yeni") ? "Yeni eğitim" : "Eğitim düzenle" },
    ];
  }

  // İlan editörü ilan listesinin bir alt kademesinde.
  if (pathname.startsWith("/kontrol-9f4x2k/firsatlar/")) {
    return [
      kok,
      { label: "İş ilanları", href: "/kontrol-9f4x2k/firsatlar" },
      { label: pathname.endsWith("/yeni") ? "Yeni ilan" : "İlanı düzenle" },
    ];
  }

  // SEO performans detayı liste sayfasının bir alt kademesinde.
  if (pathname.startsWith("/kontrol-9f4x2k/seo-performans/")) {
    return [kok, { label: "SEO performansı", href: "/kontrol-9f4x2k/seo-performans" }, { label: "Sayfa detayı" }];
  }

  // Blog editörü de liste sayfasının bir alt kademesinde.
  if (pathname.startsWith("/kontrol-9f4x2k/blog/")) {
    const alt = pathname.endsWith("/yeni")
      ? "Yeni yazı"
      : pathname.endsWith("/kategoriler")
        ? "Kategoriler"
        : "Yazıyı düzenle";
    return [kok, { label: "Blog", href: "/kontrol-9f4x2k/blog" }, { label: alt }];
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
  /*
    trailingSlash:true → usePathname() sondaki eğik çizgiyle dönüyor
    ("/kontrol-9f4x2k/odemeler/"). Kırpılmadan sayfa başlığı hiç eşleşmiyor
    (kırıntıda "Sayfa" yazıyordu) ve Genel bakış menüde hiç seçili
    görünmüyordu. PanelShell'deki ile aynı düzeltme.
  */
  const hamPathname = usePathname();
  const pathname = hamPathname.length > 1 ? hamPathname.replace(/\/+$/, "") : hamPathname;
  const [menuAcik, setMenuAcik] = useState(false);

  // Menü açıkken gövdeyi kilitle: menü kendi içinde kayarken arkadaki sayfa
  // da kayıyordu. Kural globals.css'te yalnızca native için tanımlı.
  useEffect(() => {
    if (menuAcik) document.body.dataset.menuAcik = "1";
    else delete document.body.dataset.menuAcik;

    // Koyu menü açıkken tarayıcı çubukları da koyulaşıyor; öğrenci panelinde
    // (PanelShell) aynı davranış, gerekçesi orada uzun uzun yazılı.
    const etiket = document.querySelector('meta[name="theme-color"]');
    const eskiRenk = etiket?.getAttribute("content") ?? null;
    if (etiket && menuAcik) etiket.setAttribute("content", YAN_MENU_RENK);

    return () => {
      delete document.body.dataset.menuAcik;
      if (etiket && eskiRenk !== null) etiket.setAttribute("content", eskiRenk);
    };
  }, [menuAcik]);

  return (
    <div className="acik-kabuk flex min-h-screen bg-paper">
      {/*
        Durum çubuğu şeridi — öğrenci panelindekiyle aynı. Uygulama tam ekran
        çalıştığı için saat ve piller sayfanın üstüne biniyor; arkası açık
        kalınca başlık ile sistem yazısı üst üste geliyordu.

        z-45: başlığın (z-40) üstünde, yan menünün (z-50) ALTINDA. Tarayıcıda
        env() sıfır döndüğü için yüksekliği sıfır — web değişmiyor.
      */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-brand" />

      {menuAcik && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMenuAcik(false)}
          className="fixed inset-x-0 top-0 z-40 h-[100lvh] bg-ink/55 lg:hidden"
        />
      )}

      <aside
        // Görünüm ortak bileşenden (components/YanMenu.tsx, "Sidebar" 2b);
        // yükseklik/güvenli alan açıklaması PanelShell'de.
        className={`fixed inset-y-0 left-0 z-50 flex h-[100lvh] w-[264px] flex-none flex-col gap-5 overflow-hidden ${YAN_MENU_ZEMIN} transition-transform duration-200 pb-[calc(100lvh-100dvh)] lg:sticky lg:top-0 lg:h-screen lg:pb-0 lg:translate-x-0 ${
          menuAcik ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <YanMenuZemin />
        <MenuMarka
          href="/kontrol-9f4x2k"
          baslik="Akademi Yönetim"
          alt="Yönetim"
          onGit={() => setMenuAcik(false)}
          onKapat={() => setMenuAcik(false)}
        />

        <nav className="panel-menu-liste relative flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-3">
          {groups.map((g) => (
            <MenuGrup key={g.title} baslik={g.title}>
              {g.items.map((m) => (
                <MenuOgesi
                  key={m.href}
                  href={m.href}
                  etiket={m.label}
                  ikon={m.icon}
                  aktif={isActive(pathname, m.href)}
                  sayi={m.sayac ? sayilar[m.sayac] : 0}
                  onGit={() => setMenuAcik(false)}
                />
              ))}
            </MenuGrup>
          ))}
        </nav>

        <MenuAlt
          basHarf={initials(isim)}
          ad={isim}
          eposta={email}
          ikincil={{ href: "/panel", etiket: "Öğrenci görünümü" }}
          cikis={cikisYap}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        {/* Güvenli alan boşluğu: başlık çentiğin/durum çubuğunun altında kalmasın. */}
        <header className="sticky top-0 z-40 border-b border-ink/9 bg-paper/92 pt-[env(safe-area-inset-top)] yapiskan-baslik">
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
              href="/kontrol-9f4x2k/egitimler/yeni"
              aria-label="Yeni eğitim"
              // Genel bakışta masaüstünde aynı düğme sayfa başlığında; iki kez
              // görünmesin. Telefonda (+ simgesi) kalıyor.
              className={`inline-flex h-9 flex-none items-center gap-[6px] rounded-[9px] bg-ink px-[11px] text-[13.5px] font-semibold text-white transition hover:bg-brand sm:px-[15px] ${
                pathname === "/kontrol-9f4x2k" ? "sm:hidden" : ""
              }`}
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
