import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { TopLoader } from "@/components/site/TopLoader";
import { BildirimSaglayici } from "@/components/Bildirim";
import { Olcumleme, ONYUKLEME } from "@/components/site/Olcumleme";
import { CerezBandi } from "@/components/site/CerezBandi";
import { ServiceWorkerKaydi } from "@/components/site/ServiceWorkerKaydi";
import { NativeIsaretci } from "@/components/site/NativeIsaretci";
import { getMarka } from "@/lib/marka";
import { getOlcumleme, olcumlemeAcik } from "@/lib/olcumleme";
import "./globals.css";
import { SITE_URL, SITE_ADI, VARSAYILAN_ACIKLAMA, kurumSemasi, siteSemasi } from "@/lib/seo";

const heading = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-aea",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Favicon admin panelinden yüklenebildiği için metadata dinamik üretilir;
// yüklenmemişse app/favicon.ico devreye girer.
export async function generateMetadata(): Promise<Metadata> {
  const marka = await getMarka();

  return {
    // metadataBase olmadan göreli adresler (paylaşım görseli, kanonik)
    // localhost'a çözülüyor ve paylaşımlarda bozuk çıkıyor.
    metadataBase: new URL(SITE_URL),
    // Alt sayfalar yalnızca kendi başlığını yazıyor, marka adı buradan
    // ekleniyor — her sayfada elle yazmak er geç tutarsızlaşıyor.
    title: { default: SITE_ADI, template: `%s — ${SITE_ADI}` },
    description: VARSAYILAN_ACIKLAMA,
    openGraph: {
      type: "website",
      siteName: SITE_ADI,
      locale: "tr_TR",
      url: SITE_URL,
      // Paylaşım görseli panelden geliyor; yüklenmemişse hiç basılmıyor.
      ...(marka.ogGorsel ? { images: [{ url: marka.ogGorsel }] } : {}),
    },
    twitter: marka.ogGorsel
      ? { card: "summary_large_image", images: [marka.ogGorsel] }
      : { card: "summary" },
    /*
      İkonlar tek kaynaktan.

      src/app/favicon.ico KALDIRILDI: dosya tabanlı favicon hem kendi <link>
      etiketini basıyor hem de /favicon.ico adresini işgal ediyordu. Panelden
      yüklenen ikon da ayrıca basılınca sayfada üç ikon bağlantısı oluyor ve
      tarayıcı boyutu/tipi belirtilmiş olan yerleşik .ico'yu tercih ediyordu —
      yüklenen favicon hiç görünmüyordu.
    */
    icons: marka.favicon
      ? { icon: marka.favicon, shortcut: marka.favicon, apple: marka.favicon }
      : { icon: "/icon-192.png", shortcut: "/icon-192.png", apple: "/apple-touch-icon.png" },
    // iOS ana ekrandan açıldığında Safari çubuğu olmadan, tam ekran çalışsın.
    // Android bu bilgiyi manifest'ten okuyor, iOS hâlâ bu etiketlere bakıyor.
    appleWebApp: {
      capable: true,
      title: "AE Akademi",
      statusBarStyle: "black-translucent",
    },
  };
}

export const viewport: Viewport = {
  // Panelin durum çubuğu şeridiyle aynı marka mavisi.
  themeColor: "#1c56f3",
  // Panel ana ekrandan açıldığında telefonun çentik/alt çubuk alanına kadar
  // uzansın; aksi halde standalone modda kenarlarda boş şeritler kalıyor.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Panelde GA4/GTM tanımlı değilse ne etiket ne de çerez bandı basılır —
  // izin sorulacak bir şey yokken banner göstermek ziyaretçiyi boşa yorar.
  const olcumlemeVar = olcumlemeAcik(await getOlcumleme());

  return (
    <html lang="tr" className={`${heading.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {/*
          İzin varsayılanı Google etiketlerinden önce senkron çalışmak zorunda,
          o yüzden next/script değil düz inline script — gerekçesi Olcumleme.tsx'te.
        */}
        {olcumlemeVar && <script dangerouslySetInnerHTML={{ __html: ONYUKLEME }} />}
        {/*
          Yapısal veri: arama motoruna sayfanın ne olduğunu söylüyor. İçerik
          bizim ürettiğimiz sabit bir nesne, dışarıdan gelen veri yok.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([kurumSemasi(), siteSemasi()]) }}
        />
      </head>
      <body className="antialiased font-body text-ink bg-white">
        <Olcumleme />
        <ServiceWorkerKaydi />
        <NativeIsaretci />
        <TopLoader />
        <BildirimSaglayici>{children}</BildirimSaglayici>
        {olcumlemeVar && <CerezBandi />}
      </body>
    </html>
  );
}
