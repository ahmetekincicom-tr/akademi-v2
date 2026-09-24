import Link from "next/link";
import { ON_YUZ_ACIK } from "@/proxy";
import { Logo } from "@/components/site/Logo";
import { SadeceWeb, UygulamadaPasif } from "@/components/panel/SadeceWeb";
import { WHATSAPP_NUMARALAR, whatsappLink } from "@/lib/iletisim";

/**
 * Oturum ekranlarının kabuğu — koyu, ortalanmış, sade (giriş, kayıt, şifre
 * sıfırlama ve bunların sonuç ekranları).
 *
 * Tek sütun: solda duran tanıtım paneli kaldırıldı; bu ekranlara gelen kişi
 * zaten katılımcı, ikna değil geçiş arıyor. Form ~360 px'te ortada, yükseklik
 * 100dvh — mobilde tarayıcı çubuğu açılıp kapanınca zıplamıyor. İçerik
 * ekrandan uzunsa (klavye açıkken, kayıt formu) sayfa normal kayıyor; hiçbir
 * yerde dikey taşma kırpılmıyor.
 *
 * Renkler proje token'larından (brand, font-heading); koyu zemin ve gri
 * tonları yalnız bu kabukta. `auth-koyu` sınıfı odak halkasını koyu zemine
 * göre güçlendiriyor (globals.css).
 */
export function AuthShell({
  topText,
  topLinkLabel,
  topLinkHref,
  children,
}: {
  topText: string;
  topLinkLabel: string;
  topLinkHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-koyu relative flex min-h-[100dvh] flex-col overflow-x-clip bg-[#08090c] text-[#fafafa] antialiased">
      {/*
        Durum çubuğu şeridi — panel ve yönetim ekranlarındakiyle aynı. Uygulama
        tam ekran çalıştığında saat ve piller sayfanın üstüne biniyor.
        Tarayıcıda env() sıfır döndüğü için yüksekliği sıfır — web değişmiyor.
      */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-brand" />

      {/* Üstte hafif mavi ışıma: dekoratif, tıklamaları engellemiyor. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-340px] left-1/2 h-[600px] w-[1100px] max-w-none -translate-x-1/2 rounded-[50%]"
        style={{ background: "radial-gradient(closest-side, rgba(28,86,243,0.24), transparent)" }}
      />

      <header className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-2 sm:px-9 sm:pt-[calc(28px+env(safe-area-inset-top))]">
        {/* Uygulamada logo tıklanmıyor: pazarlama sitesine açılan kapı olurdu.
            Ön yüz kapalıyken logo ana sayfaya değil giriş ekranına bakıyor. */}
        <UygulamadaPasif>
          <Logo href={ON_YUZ_ACIK ? "/" : "/giris"} variant="light" yer="baslik" subline="Öğrenci paneli" />
        </UygulamadaPasif>
        {/* <div>, <p> değil: globals.css'teki "p a" kuralı bağlantının altını çiziyordu. */}
        <div className="text-[13.5px] text-[#a1a1aa]">
          {topText}{" "}
          <Link
            href={topLinkHref}
            className="inline-flex items-center rounded-[6px] py-2 font-semibold text-white hover:text-[#c7d6ff]"
          >
            {topLinkLabel} <span aria-hidden className="ml-1">→</span>
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col px-5 py-8 sm:py-12">
        {/* my-auto: kısa içerik ortada, uzun içerik üstten başlayıp kayıyor. */}
        <div className="mx-auto my-auto w-full max-w-[360px]">{children}</div>
      </main>

      {/* Mobilde alt boşluk sağ alttaki WhatsApp düğmesini (56px) aşacak kadar:
          yoksa düğme "Destek" bağlantısının üstüne biniyordu. */}
      <footer className="relative px-5 pt-4 pb-[calc(84px+env(safe-area-inset-bottom))] sm:pb-[calc(24px+env(safe-area-inset-bottom))]">
        <nav aria-label="Yasal ve destek" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12.5px]">
          <Link href="/uyelik-sozlesmesi" className="py-1 text-[#a1a1aa] hover:text-white">
            Kullanım Koşulları
          </Link>
          <Link href="/gizlilik-politikasi" className="py-1 text-[#a1a1aa] hover:text-white">
            Gizlilik
          </Link>
          <Link href="/kisisel-verilerin-islenmesi" className="py-1 text-[#a1a1aa] hover:text-white">
            KVKK
          </Link>
          {/* Uygulamada dış bağlantı yok (App Store yönergesi; bkz. SadeceWeb). */}
          <SadeceWeb>
            <a
              href={whatsappLink(WHATSAPP_NUMARALAR[0].numara)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-[#a1a1aa] hover:text-white"
            >
              Destek
            </a>
          </SadeceWeb>
        </nav>
      </footer>
    </div>
  );
}
