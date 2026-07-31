import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { TopLoader } from "@/components/site/TopLoader";
import { getMarka } from "@/lib/marka";
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
    ...(marka.favicon ? { icons: { icon: marka.favicon, shortcut: marka.favicon, apple: marka.favicon } } : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${heading.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased font-body text-ink bg-white">
        <TopLoader />
        {children}
      </body>
    </html>
  );
}
