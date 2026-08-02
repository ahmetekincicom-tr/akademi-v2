import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { TopLoader } from "@/components/site/TopLoader";
import { BildirimSaglayici } from "@/components/Bildirim";
import { Olcumleme, ONYUKLEME } from "@/components/site/Olcumleme";
import { CerezBandi } from "@/components/site/CerezBandi";
import { ServiceWorkerKaydi } from "@/components/site/ServiceWorkerKaydi";
import { getMarka } from "@/lib/marka";
import { getOlcumleme, olcumlemeAcik } from "@/lib/olcumleme";
import "./globals.css";

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
    title: "Ahmet Ekinci Akademi",
    description:
      "Ankara merkezli, birebir dijital pazarlama eğitimi — Meta Ads, sosyal medya yönetimi ve yapay zekâ araçları.",
    ...(marka.favicon
      ? { icons: { icon: marka.favicon, shortcut: marka.favicon, apple: marka.favicon } }
      : { icons: { apple: "/apple-touch-icon.png" } }),
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
  themeColor: "#0a0d18",
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
      </head>
      <body className="antialiased font-body text-ink bg-white">
        <Olcumleme />
        <ServiceWorkerKaydi />
        <TopLoader />
        <BildirimSaglayici>{children}</BildirimSaglayici>
        {olcumlemeVar && <CerezBandi />}
      </body>
    </html>
  );
}
