"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cikisYap } from "@/app/panel/actions";
import { Icon, type IconName } from "@/components/Icon";
import { Breadcrumb, type BreadcrumbAdim } from "@/components/Breadcrumb";
import { useNativeUygulama } from "@/lib/native";
import type { PanelProfile } from "@/lib/panel";
import type { PanelBildirimleri } from "@/lib/bildirimler";
import { DERSLER_ACIK } from "@/lib/bolumler";
import { SOSYAL } from "@/lib/iletisim";

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
      { href: "/panel/gorusmeler", label: "Danışmanlık görüşmeleri", icon: "calendar" },
      { href: "/panel/soru-cevap", label: "Soru-cevap", icon: "message", rozet: "soruCevap" },
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
  "/panel/yeni-egitimler": "Yeni eğitimler",
  "/panel/hesabim": "Hesabım",
};

export function PanelShell({
  children,
  profil,
  aktifProgram,
  programSayisi,
  bildirim,
}: {
  children: React.ReactNode;
  profil: PanelProfile;
  aktifProgram: { baslik: string; slug: string } | null;
  programSayisi: number;
  /** Menü rozetleri; genel bakıştaki bildirim kutusuyla aynı kaynak. */
  bildirim: PanelBildirimleri;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Panel";
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
    // --color-ink; menünün zemini.
    if (etiket && menuAcik) etiket.setAttribute("content", "#0a0d18");

    return () => {
      delete document.body.dataset.menuAcik;
      if (etiket && eskiRenk !== null) etiket.setAttribute("content", eskiRenk);
    };
  }, [menuAcik]);

  const adimlar: BreadcrumbAdim[] =
    pathname === "/panel" ? [{ label: "Panel" }] : [{ label: "Panel", href: "/panel" }, { label: pageTitle }];

  return (
    <div className="flex min-h-screen bg-paper">
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
          className="fixed inset-0 z-40 bg-ink/55 lg:hidden"
        />
      )}

      <aside
        // h-dvh: iOS'ta h-screen tarayıcı çubuklarını hesaba katmıyor ve menü
        // ekrandan taşıyordu, alttaki çıkış düğmesi kesiliyordu.
        /*
          Zemin düz bg-ink değil, hafif bir dikey degrade: üstte biraz açılıp
          altta koyulaşınca menü düz bir blok olmaktan çıkıp derinlik
          kazanıyor. Sağ kenardaki ince beyaz çizgi de menüyü içerikten
          "kesiyor" — tek başına kenarlık koymaktan daha yumuşak duruyor.
        */
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[276px] flex-none flex-col bg-ink bg-gradient-to-b from-[#111629] via-ink to-[#070a12] text-white/66 shadow-[inset_-1px_0_0_rgba(255,255,255,0.07)] transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuAcik ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Yan menü de tam ekran yüksekliğinde: üstü çentiğe girmesin. */}
        <div className="flex items-center justify-between border-b border-white/10 px-[22px] pt-[calc(26px+env(safe-area-inset-top))] pb-5">
          <Link
            href={native ? "/panel" : "/"}
            className="flex items-center gap-[11px] text-white"
            onClick={() => setMenuAcik(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold">
              AE
            </span>
            <span className="flex flex-col leading-[1.15]">
              <span className="font-heading text-sm font-semibold">Ahmet Ekinci</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase">Öğrenci paneli</span>
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

        <div className="border-b border-white/8 px-[18px] pt-4 pb-[14px]">
          {aktifProgram && DERSLER_ACIK ? (
            <Link
              href="/panel/dersler"
              className="group flex w-full items-center gap-[11px] rounded-[11px] border border-white/12 bg-white/[0.04] px-3 py-[11px] text-left transition hover:border-brand/60 hover:bg-white/[0.07]"
            >
              <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] bg-brand/20 text-[#7FA0FF]">
                <Icon name="play" size={13} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] tracking-[0.16em] text-white/55 uppercase">
                  {programSayisi > 1 ? `Aktif program · ${programSayisi} kayıt` : "Aktif program"}
                </span>
                <span className="mt-[3px] block truncate text-[13px] font-semibold text-white">
                  {aktifProgram.baslik}
                </span>
              </span>
              <Icon name="chevronRight" size={14} className="flex-none text-white/55 transition group-hover:text-white/70" />
            </Link>
          ) : (
            /* Dersler kapalıyken kutu duruyor ama tıklanmıyor: programın adı
               bilgi, oynatıcıya çıkan yol ise henüz yok. */
            <div className="rounded-[11px] border border-white/12 bg-white/[0.04] px-3 py-[11px]">
              <span className="block font-mono text-[9px] tracking-[0.16em] text-white/55 uppercase">
                Aktif program
              </span>
              <span className="mt-[3px] block truncate text-[13px] font-semibold text-white/70">
                {aktifProgram ? aktifProgram.baslik : "Henüz kayıt yok"}
              </span>
            </div>
          )}
        </div>

        {/*
          min-h-0 + flex-1 şart: flex çocuğu varsayılan olarak içeriğinin
          altına küçülmüyor, o yüzden overflow-auto hiç devreye girmiyor ve
          liste alttaki profil/çıkış bloğunun altına taşıyordu (menü uzayınca
          "Ödemelerim" yarıdan kesiliyordu). Bu ikisiyle liste kendi içinde
          kayıyor, alt blok her zaman yerinde duruyor.
        */}
        <nav className="panel-menu-liste flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto overscroll-contain px-[14px] pt-[14px] pb-2">
          {gorunenGruplar.map((g) => (
            <div key={g.title} className="flex flex-col gap-[2px]">
              <div className="px-[13px] pb-[7px] font-mono text-[9px] tracking-[0.2em] text-white/55 uppercase">
                {g.title}
              </div>
              {g.items.map((m) => {
                const active = pathname === m.href;
                const sayi = m.rozet ? bildirim.sayac[m.rozet] : 0;
                // Ödeme sayı taşımıyor: "kaç tane" değil "hâlâ duruyor"
                // bilgisi. Nokta o yüzden sayıdan ayrı.
                const uyariVar = Boolean(m.uyari && bildirim.odemeBekliyor);

                if (m.yakinda) {
                  return (
                    <div
                      key={m.href}
                      aria-disabled
                      /* Ölçüler aktif satırlarla birebir aynı: farklı dolgu
                         ya da kenarlık, kapalı bölümleri listede kaydırıyordu. */
                      className="flex cursor-not-allowed items-center gap-[11px] rounded-[11px] px-3 py-[11px] text-sm"
                      style={{ color: "rgba(255,255,255,0.34)", fontWeight: 500 }}
                    >
                      <span className="flex flex-none opacity-45">
                        <Icon name={m.icon} size={17} />
                      </span>
                      <span className="flex-1 truncate">{m.label}</span>
                      <span className="flex-none rounded-full bg-white/10 px-[7px] py-[2px] font-mono text-[9px] tracking-[0.06em] text-white/55 uppercase">
                        Çok yakında
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuAcik(false)}
                    /*
                      Sol kenarlık yerine tam yuvarlatılmış bir satır: seçili
                      öğe soldan sağa sönen bir marka degradesi, ince bir iç
                      çerçeve ve yumuşak bir gölge taşıyor. Düz renk bloğuna
                      göre daha katmanlı duruyor. Dikey dolgu da büyüdü —
                      hem daha ferah hem parmakla daha kolay.
                    */
                    className={`relative flex items-center gap-[11px] rounded-[11px] px-3 py-[11px] text-sm transition-colors duration-150 hover:bg-white/[0.07] hover:text-white ${
                      active ? "shadow-[inset_0_0_0_1px_rgba(28,86,243,0.42),0_6px_18px_-8px_rgba(28,86,243,0.65)]" : ""
                    }`}
                    style={{
                      background: active
                        ? "linear-gradient(90deg, rgba(28,86,243,0.34) 0%, rgba(28,86,243,0.10) 100%)"
                        : m.vurgulu || sayi > 0 || uyariVar
                          ? "rgba(255,255,255,0.06)"
                          : "transparent",
                      color:
                        active || m.vurgulu || sayi > 0 || uyariVar ? "#FFFFFF" : "rgba(255,255,255,0.62)",
                      fontWeight: m.vurgulu || sayi > 0 || uyariVar ? 600 : 500,
                    }}
                  >
                    <span
                      className="relative flex flex-none"
                      style={{
                        opacity: m.vurgulu || sayi > 0 || uyariVar ? 1 : 0.8,
                        color: uyariVar ? "#FFB4B6" : (m.vurgulu || sayi > 0) && !active ? "#A9C0FF" : undefined,
                      }}
                    >
                      <Icon name={m.icon} size={17} />
                      {/*
                        Ödeme uyarısı simgenin köşesinde nokta olarak duruyor.
                        Sayı yazılmıyor: bekleyen ödeme adedi kullanıcının
                        aklında tuttuğu bir sayı değil, "bir şey duruyor"
                        bilgisi yeterli. Kırmızı, çünkü diğer rozetlerden
                        farklı olarak bu eylem bekliyor.
                      */}
                      {uyariVar && (
                        <span className="absolute -top-[3px] -right-[3px] h-[7px] w-[7px] rounded-full bg-[#E5484D] ring-2 ring-ink" />
                      )}
                    </span>
                    <span className="flex-1 truncate">{m.label}</span>
                    {/* Sayı yalnızca okunmamış varken çıkıyor; sıfır rozeti
                        her gün duran bir gürültüye dönüşüyor. */}
                    {sayi > 0 && (
                      <span className="flex-none rounded-full bg-brand px-[7px] py-[2px] font-mono text-[9.5px] font-semibold text-white">
                        {sayi > 9 ? "9+" : sayi}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Alt güvenli alan: ana ekran çubuğu çıkış düğmesini kesiyordu. */}
        <div className="mt-auto px-[18px] pt-4 pb-[calc(22px+env(safe-area-inset-bottom))]">
          {profil.admin && (
            <Link
              href="/kontrol-9f4x2k"
              className="mb-4 flex h-10 items-center justify-center gap-2 rounded-[10px] border border-brand/45 bg-brand/12 text-[13.5px] font-semibold text-[#A9C0FF] transition hover:bg-brand hover:text-white"
            >
              <Icon name="shield" size={15} />
              Yönetim paneli
            </Link>
          )}
          {/*
            Sosyal bağlantılar. Panelde de duruyor çünkü katılımcının eğitmene
            ulaşacağı en kısa yol bu; WhatsApp zaten destek hattı. Adresler
            lib/iletisim'deki tek kaynaktan (SOSYAL) geliyor, footer ile aynı.
          */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {SOSYAL.map((s) => (
              <a
                key={s.ad}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.ad}
                title={s.ad}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-white/12 bg-white/[0.04] text-white/60 transition hover:border-brand/60 hover:bg-brand hover:text-white"
              >
                <Icon name={s.ikon} size={16} />
              </a>
            ))}
          </div>

          {/* Profil kutusu: eskiden çıplak bir satırdı; kendi zemini olunca
              menünün geri kalanından ayrılıyor ve alt blok toparlanıyor. */}
          <div className="flex items-center gap-[10px] rounded-[12px] border border-white/10 bg-white/[0.04] px-[11px] py-[10px]">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand/25 font-mono text-[11px] font-semibold text-[#A9C0FF]">
              {profil.basHarfler}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-white">{profil.tamAd}</span>
              <span className="block truncate font-mono text-[10px] text-white/55">{profil.email}</span>
            </span>
          </div>
          <form action={cikisYap}>
            <button
              type="submit"
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[9px] border border-[#E5484D]/35 text-[13px] font-semibold text-[#FF9A9D] transition hover:border-[#E5484D] hover:bg-[#E5484D] hover:text-white"
            >
              <Icon name="logout" size={15} />
              Çıkış yap
            </button>
          </form>
        </div>
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
              className="inline-flex h-[38px] flex-none items-center gap-2 rounded-[9px] bg-ink px-[11px] text-[13.5px] font-semibold text-white transition hover:bg-brand sm:px-[15px]"
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
