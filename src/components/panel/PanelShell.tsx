"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/panel/actions";
import { Icon, type IconName } from "@/components/Icon";
import { MenuAlt, MenuGrup, MenuMarka, MenuOgesi, MenuProgram, MenuYakinda, YanMenuZemin, YAN_MENU_RENK, YAN_MENU_ZEMIN } from "@/components/YanMenu";
import { Breadcrumb, type BreadcrumbAdim } from "@/components/Breadcrumb";
import { useNativeUygulama } from "@/lib/native";
import type { PanelProfile } from "@/lib/panel";
import type { PanelBildirimleri } from "@/lib/bildirimler";
import { DERSLER_ACIK, FIRSATLAR_ACIK } from "@/lib/bolumler";

type MenuItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Menüde ayrıca öne çıkarılan bölüm. */
  vurgulu?: boolean;
  /** Okunmamış sayacı hangi sayaçtan okunacak. */
  rozet?: "duyuru" | "birebir" | "soruCevap";
  /** Sayı değil, duran bir uyarı taşıyan bölüm (bekleyen ödeme gibi). */
  uyari?: boolean;
  /**
   * Henüz açılmamış bölüm: tıklanamaz, yanında "Çok yakında" etiketi çıkar.
   * Menüden tamamen kaldırmak yerine bırakılıyor — yolun var olduğunu
   * göstermek, sonradan belirmesinden daha anlaşılır.
   */
  yakinda?: boolean;
};
type MenuGroup = { title: string; items: MenuItem[] };

const groups: MenuGroup[] = [
  {
    title: "Öğrenme",
    items: [
      { href: "/panel", label: "Genel bakış", icon: "grid" },
      // Gündem listenin sonundaydı ve göz oraya en son gidiyordu. Zaman
      // duyarlı tek bölüm burası: içeriği eskiyen, "bugün ne oldu" diye
      // bakılan yer. Genel bakışın hemen altında.
      { href: "/panel/duyurular", label: "Gündem", icon: "bell", vurgulu: true, rozet: "duyuru" },
      // Ders videoları hazır değil; bölüm menüde duruyor ama tıklanmıyor.
      // Bayrak lib/bolumler.ts'te, üç yerde ayrı ayrı değil.
      { href: "/panel/dersler", label: "Derslerim", icon: "playCircle", yakinda: !DERSLER_ACIK },
      { href: "/panel/testlerim", label: "Testlerim", icon: "check" },
      { href: "/panel/birebir-egitim", label: "Birebir eğitim", icon: "calendar", rozet: "birebir" },
      { href: "/panel/dokumanlar", label: "Doküman kütüphanesi", icon: "file" },
    ],
  },
  {
    title: "Destek",
    items: [
      // "Birebir seanslar" buradan kaldırıldı: birebir eğitimin kendi
      // takvimi ve kayıtları artık Birebir eğitim sayfasında, iki ayrı
      // takvim sekmesi aynı şeyi anlatıyordu.
      { href: "/panel/gorusmeler", label: "Danışmanlık görüşmeleri", icon: "users" },
      { href: "/panel/soru-cevap", label: "Soru-cevap", icon: "message", rozet: "soruCevap" },
    ],
  },
  {
    title: "Kariyer",
    items: [
      // Bayrak lib/bolumler.ts'te; ilk ilan yayına alınınca açılacak.
      { href: "/panel/firsatlar", label: "İş fırsatları", icon: "briefcase", yakinda: !FIRSATLAR_ACIK },
    ],
  },
  {
    title: "Hesap",
    items: [
      { href: "/panel/odemelerim", label: "Ödemelerim", icon: "card", uyari: true },
      { href: "/panel/yeni-egitimler", label: "Yeni eğitimler", icon: "sparkle", yakinda: true },
      { href: "/panel/hesabim", label: "Hesabım", icon: "user" },
    ],
  },
];

// Yalnızca web'de görünen yollar; gerekçe bileşenin içinde.
const webeAit = new Set(["/panel/odemelerim", "/panel/yeni-egitimler"]);

const pageTitles: Record<string, string> = {
  "/panel": "Genel bakış",
  "/panel/dersler": "Ders izleme",
  "/panel/testlerim": "Testlerim",
  "/panel/birebir-egitim": "Birebir eğitim",
  "/panel/on-degerlendirme": "Ön değerlendirme",
  "/panel/odemelerim": "Ödemelerim",
  "/panel/dokumanlar": "Doküman kütüphanesi",
  "/panel/duyurular": "Gündem",
  "/panel/gorusmeler": "Danışmanlık görüşmeleri",
  "/panel/soru-cevap": "Soru-cevap",
  "/panel/firsatlar": "İş fırsatları",
  "/panel/yeni-egitimler": "Yeni eğitimler",
  "/panel/hesabim": "Hesabım",
};

export function PanelShell({
  children,
  profil,
  bildirim,
  program,
}: {
  children: React.ReactNode;
  profil: PanelProfile;
  /** Menünün üstündeki "Aktif program" kartı; kayıt yoksa null. */
  program: { baslik: string; ilerleme: { etiket: string; yuzde: number } | null } | null;
  /** Menü rozetleri; genel bakıştaki bildirim kutusuyla aynı kaynak. */
  bildirim: PanelBildirimleri;
}) {
  const hamPathname = usePathname();
  /*
    trailingSlash:true açık → usePathname() sondaki eğik çizgiyle dönüyor
    ("/panel/duyurular/"). Menü href'leri çizgisiz ("/panel/duyurular"), bu
    yüzden düz "===" karşılaştırması hiçbir zaman tutmuyordu: aktif satır
    vurgusu ve başlık kayboluyordu. Çizgiyi kırpıp karşılaştırıyoruz.
  */
  const pathname = hamPathname.length > 1 ? hamPathname.replace(/\/+$/, "") : hamPathname;
  // İlan detayı (/panel/firsatlar/<id>) listenin bir alt kademesi.
  const ilanDetayi = pathname.startsWith("/panel/firsatlar/");
  const pageTitle = ilanDetayi ? "İlan detayı" : (pageTitles[pathname] ?? "Panel");
  const [menuAcik, setMenuAcik] = useState(false);
  const native = useNativeUygulama();

  // Native uygulamada ödeme ve satış yüzeyleri menüde yok. Apple'ın 3.1.3
  // maddesi uygulama içinden dışarıdaki ödemeye yönlendirmeyi yasaklıyor;
  // "Ödemelerim" IBAN'a, "Yeni eğitimler" satış sayfasına çıkıyor.
  const gorunenGruplar = native
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((m) => !webeAit.has(m.href)) }))
        .filter((g) => g.items.length > 0)
    : groups;

  // Menü açıkken gövdeyi kilitle: menü kendi içinde kayarken arkadaki panel
  // de kayıyordu, iki katman aynı anda oynuyordu. İşaret body'ye konuyor,
  // kuralı globals.css'te yalnızca native için tanımlı — web değişmiyor.
  useEffect(() => {
    if (menuAcik) document.body.dataset.menuAcik = "1";
    else delete document.body.dataset.menuAcik;

    /*
      Menü açıkken tarayıcı çubukları da menünün rengine dönüyor.

      Menü koyu (bg-ink) ve ekranı baştan sona kaplıyor; Safari'nin durum ve
      adres çubuğu ise sayfanın açık zeminine göre boyandığı için koyu menünün
      üstünde ve altında açık şeritler kalıyordu — menü ekrana oturmuş değil,
      araya sıkışmış gibi görünüyordu. Etiketi menü kapanınca eski değerine
      geri koyuyoruz; kapalıyken hiç dokunulmuyor.
    */
    const etiket = document.querySelector('meta[name="theme-color"]');
    const eskiRenk = etiket?.getAttribute("content") ?? null;
    // Menünün zemini.
    if (etiket && menuAcik) etiket.setAttribute("content", YAN_MENU_RENK);

    return () => {
      delete document.body.dataset.menuAcik;
      if (etiket && eskiRenk !== null) etiket.setAttribute("content", eskiRenk);
    };
  }, [menuAcik]);

  const adimlar: BreadcrumbAdim[] =
    pathname === "/panel"
      ? [{ label: "Panel" }]
      : ilanDetayi
        ? [{ label: "Panel", href: "/panel" }, { label: "İş fırsatları", href: "/panel/firsatlar" }, { label: pageTitle }]
        : [{ label: "Panel", href: "/panel" }, { label: pageTitle }];

  return (
    <div className="acik-kabuk flex min-h-screen bg-paper">
      {/*
        Durum çubuğu şeridi. Uygulama tam ekran çalıştığı için saat ve piller
        sayfanın üstüne biniyor; arkası beyaz kalınca beyaz yazı okunmuyordu.
        Marka mavisi zemin veriyoruz, sistem yazısı beyaz kalıyor.

        z-45: başlığın (z-40) üstünde ama yan menünün (z-50) ALTINDA. Menünün
        üstünde olduğunda menüyü kesiyordu; artık koyu menü kendi üst boşluğunu
        kaplıyor ve beyaz sistem yazısı onun üzerinde de okunuyor.

        Tarayıcıda env() sıfır döndüğü için yüksekliği sıfır — webde görünmüyor.
      */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-brand"
      />

      {menuAcik && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMenuAcik(false)}
          className="fixed inset-x-0 top-0 z-40 h-[100lvh] bg-ink/55 lg:hidden"
        />
      )}

      <aside
        /*
          h-[100lvh] + pb-[calc(100lvh-100dvh)]: menü ekranın fiziksel altına
          kadar uzanıyor (iOS 26 Safari'nin yüzen alt çubuğunun ARKASI dahil),
          içerik ise görünür alanın (dvh) içinde kalıyor. Yalnız h-dvh iken
          menü çubuğun üstünde bitiyor, altında karartılmış sayfa gri bir kutu
          gibi görünüyordu. (Yönetim menüsünde aynısı: AdminShell.)

          Görünüm ortak bileşenden: components/YanMenu.tsx ("Sidebar" 2b).
        */
        className={`fixed inset-y-0 left-0 z-50 flex h-[100lvh] w-[264px] flex-none flex-col gap-5 overflow-hidden ${YAN_MENU_ZEMIN} transition-transform duration-300 ease-out pb-[calc(100lvh-100dvh)] lg:sticky lg:top-0 lg:h-screen lg:pb-0 lg:translate-x-0 ${
          menuAcik ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <YanMenuZemin />
        <MenuMarka
          href={native ? "/panel" : "/"}
          baslik="Ahmet Ekinci"
          alt="Akademi"
          onGit={() => setMenuAcik(false)}
          onKapat={() => setMenuAcik(false)}
        />

        {/*
          min-h-0 + flex-1 şart: flex çocuğu varsayılan olarak içeriğinin
          altına küçülmüyor, o yüzden overflow-auto hiç devreye girmiyor ve
          liste alttaki profil/çıkış bloğunun altına taşıyordu. Bu ikisiyle
          liste kendi içinde kayıyor, alt blok her zaman yerinde duruyor.
        */}
        {program && <MenuProgram baslik={program.baslik} ilerleme={program.ilerleme} />}

        <nav className="panel-menu-liste relative flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-3">
          {gorunenGruplar.map((g) => (
            <MenuGrup key={g.title} baslik={g.title}>
              {g.items.map((m) =>
                m.yakinda ? (
                  <MenuYakinda key={m.href} etiket={m.label} ikon={m.icon} />
                ) : (
                  <MenuOgesi
                    key={m.href}
                    href={m.href}
                    etiket={m.label}
                    ikon={m.icon}
                    aktif={pathname === m.href || (m.href === "/panel/firsatlar" && ilanDetayi)}
                    // Sayı yalnızca okunmamış varken; sıfır rozeti gürültü.
                    sayi={m.rozet ? bildirim.sayac[m.rozet] : 0}
                    // Ödeme sayı değil "hâlâ duruyor" bilgisi: kırmızı nokta.
                    uyari={Boolean(m.uyari && bildirim.odemeBekliyor)}
                    onGit={() => setMenuAcik(false)}
                  />
                ),
              )}
            </MenuGrup>
          ))}
        </nav>

        <MenuAlt
          basHarf={profil.basHarfler}
          ad={profil.tamAd}
          eposta={profil.email}
          ikincil={profil.admin ? { href: "/kontrol-9f4x2k", etiket: "Yönetim paneli" } : null}
          cikis={cikisYap}
        />
      </aside>

      {/* Alt güvenli alan: içerik ana ekran çubuğunun altında kalmasın. */}
      <div className="flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        {/*
          Güvenli alan boşluğu: uygulama tam ekran çalıştığı için (viewportFit
          cover) içerik y=0'dan başlıyor ve başlık çentiğin/durum çubuğunun
          altında kalıyordu. env() tarayıcıda 0 döndüğü için web etkilenmiyor.
        */}
        <header className="sticky top-0 z-40 border-b border-ink/9 bg-paper/90 pt-[env(safe-area-inset-top)] yapiskan-baslik">
          {/*
            Sabit yükseklik yerine dolgu: h-[70px] içeriği dikeyde ortalıyordu
            ama başlık üst kenara yapışık duruyordu — özellikle telefonda
            "sıkışmış" hissi veren buydu. Üstte biraz daha fazla boşluk var
            (10px alt / 14px üst), yükseklik de min-h ile korunuyor.
          */}
          <div className="flex min-h-[78px] items-center justify-between gap-3 px-4 pt-[14px] pb-[10px] sm:min-h-[86px] sm:gap-6 sm:px-[34px] sm:pt-[18px] sm:pb-[12px]">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Menüyü aç"
                onClick={() => setMenuAcik(true)}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-[9px] border border-ink/13 bg-white text-ink transition hover:border-brand hover:text-brand lg:hidden"
              >
                <Icon name="menu" size={17} />
              </button>
              <Breadcrumb adimlar={adimlar} />
            </div>
            <Link
              href="/panel/soru-cevap"
              aria-label="Destek talebi"
              // Genel bakışta masaüstünde aynı düğme sayfanın başlığında; iki
              // kez görünmesin. Mobilde (yan menü düğmesinin karşısında) kalıyor.
              className={`inline-flex h-[38px] flex-none items-center gap-2 rounded-[9px] bg-ink px-[11px] text-[13.5px] font-semibold text-white transition hover:bg-brand sm:px-[15px] ${
                pathname.replace(/\/$/, "") === "/panel" ? "sm:hidden" : ""
              }`}
            >
              <Icon name="message" size={15} />
              <span className="hidden sm:inline">Destek talebi</span>
            </Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
