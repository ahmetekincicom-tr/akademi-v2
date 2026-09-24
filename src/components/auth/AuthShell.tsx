import Link from "next/link";
import { ON_YUZ_ACIK } from "@/proxy";
import { Logo } from "@/components/site/Logo";
import { SadeceWeb, UygulamadaPasif } from "@/components/panel/SadeceWeb";
import { WHATSAPP_NUMARALAR, whatsappLink } from "@/lib/iletisim";
import { Icon } from "@/components/Icon";

/**
 * Oturum ekranlarının ortak kabuğu: giriş, kayıt, şifre sıfırlama ve sonuç
 * ekranları aynı kartı, logoyu, zemini ve boşluk sistemini paylaşıyor.
 *
 * Yapı (yukarıdan aşağı): kart [logo → Giriş yap / Kayıt ol sekmeleri →
 * içerik] → "Ana sayfaya dön" → yasal bağlantılar.
 *
 * - Sekmeler gerçek bağlantı (/giris, /kayit); URL yapısı aynı. Yalnız giriş
 *   ve kayıtta çiziliyor (`sekme`), diğer ekranlarda kart sekmesiz.
 * - Kart ÜSTTEN hizalı, dikey ortalı değil: giriş ile kayıt arasında
 *   geçerken kartın üstü aynı yerde kalıyor, düzen sıçramıyor; uzun kayıt
 *   formu da ekranı aşarsa sayfa doğal olarak kayıyor.
 * - 100dvh + güvenli alanlar (çentik, alt çubuk). Yatay taşma kırpılıyor.
 * - Renkler proje token'larından (brand, font-heading); koyu tonlar yalnız
 *   bu kabukta. `.auth-koyu` odak halkasını ve sağ alttaki WhatsApp balonunu
 *   (yalnız bu ekranlarda gizli; altbilgide "Destek" var) yönetiyor —
 *   globals.css.
 */
export function AuthShell({
  sekme,
  children,
}: {
  /** Giriş/kayıt ekranlarında etkin sekme; verilmezse sekme çizilmez. */
  sekme?: "giris" | "kayit";
  children: React.ReactNode;
}) {
  const anaSayfa = ON_YUZ_ACIK ? "/" : "/giris";

  return (
    <div className="auth-koyu relative flex min-h-[100dvh] flex-col overflow-x-clip bg-[#060810] text-[#fafafa] antialiased">
      {/*
        Durum çubuğu şeridi — panel ve yönetim ekranlarındakiyle aynı. Uygulama
        tam ekran çalıştığında saat ve piller sayfanın üstüne biniyor.
        Tarayıcıda env() sıfır döndüğü için yüksekliği sıfır — web değişmiyor.
      */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-brand" />

      {/* Kartın arkasında çok hafif mavi ışıma; dekoratif. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-120px] left-1/2 h-[720px] w-[1100px] max-w-none -translate-x-1/2"
        style={{ background: "radial-gradient(closest-side, rgba(28,86,243,0.16), rgba(28,86,243,0.05) 55%, transparent)" }}
      />

      <main className="relative flex flex-1 flex-col items-center px-4 pt-[calc(clamp(20px,7vh,72px)+env(safe-area-inset-top))] pb-6 sm:px-6">
        <div className="w-full max-w-[460px] rounded-[20px] border border-white/[0.08] bg-[#0d1017]/95 px-5 pt-7 pb-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-24px_rgba(0,0,0,0.8)] sm:px-9 sm:pt-9 sm:pb-8">
          {/* Logo ortada; tıklanınca ana sayfa. Uygulamada tıklanmıyor
              (pazarlama sitesine açılan kapı olurdu). */}
          <div className="flex justify-center">
            <UygulamadaPasif>
              <Logo href={anaSayfa} variant="light" yer="baslik" subline="Öğrenci paneli" />
            </UygulamadaPasif>
          </div>

          {sekme && (
            <nav aria-label="Giriş veya kayıt" className="mt-7 grid grid-cols-2 gap-1 rounded-[12px] border border-white/[0.07] bg-[#07090e] p-1">
              {(
                [
                  ["giris", "/giris", "Giriş yap"],
                  ["kayit", "/kayit", "Kayıt ol"],
                ] as const
              ).map(([k, href, ad]) => {
                const aktif = sekme === k;
                return (
                  <Link
                    key={k}
                    href={href}
                    aria-current={aktif ? "page" : undefined}
                    className={`flex h-10 items-center justify-center rounded-[9px] text-[14px] font-semibold transition-colors ${
                      aktif
                        ? "bg-[#1b1f2a] text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]"
                        : "text-[#a1a1aa] hover:text-white"
                    }`}
                  >
                    {ad}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className={sekme ? "mt-7" : "mt-8"}>{children}</div>
        </div>

        {/* Görünür dönüş yolu. Uygulamada yok: pazarlama sitesine açılıyordu. */}
        {ON_YUZ_ACIK && (
          <SadeceWeb>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-[8px] px-2 py-2 text-[13.5px] font-medium text-[#a1a1aa] hover:text-white"
            >
              <Icon name="arrowLeft" size={15} />
              Ana sayfaya dön
            </Link>
          </SadeceWeb>
        )}
      </main>

      <footer className="relative px-5 pt-2 pb-[calc(24px+env(safe-area-inset-bottom))]">
        <nav aria-label="Yasal ve destek" className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[12.5px]">
          <Link href="/uyelik-sozlesmesi" className="py-1.5 text-[#8b8b95] hover:text-white">
            Kullanım Koşulları
          </Link>
          <Link href="/gizlilik-politikasi" className="py-1.5 text-[#8b8b95] hover:text-white">
            Gizlilik
          </Link>
          <Link href="/kisisel-verilerin-islenmesi" className="py-1.5 text-[#8b8b95] hover:text-white">
            KVKK
          </Link>
          {/* Uygulamada dış bağlantı yok (bkz. SadeceWeb). Bu ekranlarda
              yüzen WhatsApp balonunun yerini bu sade bağlantı alıyor. */}
          <SadeceWeb>
            <a
              href={whatsappLink(WHATSAPP_NUMARALAR[0].numara)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 text-[#8b8b95] hover:text-white"
            >
              Destek
            </a>
          </SadeceWeb>
        </nav>
      </footer>
    </div>
  );
}
