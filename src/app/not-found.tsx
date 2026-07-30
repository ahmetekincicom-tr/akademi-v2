import Link from "next/link";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { siteNav } from "@/components/site/siteNav";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı — Ahmet Ekinci Akademi",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader nav={siteNav} ctaLabel="Eğitimleri incele" ctaHref="/egitimler" />

      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center px-8 py-24">
        <span className="font-mono text-[11px] tracking-[0.16em] text-brand uppercase">404</span>
        <h1 className="mt-4 max-w-[620px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Aradığın sayfayı bulamadık.
        </h1>
        <p className="mt-5 max-w-[520px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Bağlantı taşınmış veya yazım hatası olabilir. Aşağıdan devam edebilir ya da bize yazabilirsin.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-[52px] items-center rounded-[11px] bg-brand px-7 text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] transition hover:bg-ink"
          >
            Ana sayfaya dön
          </Link>
          <Link
            href="/egitimler"
            className="inline-flex h-[52px] items-center rounded-[11px] border border-ink/14 px-6 text-base font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Eğitimlere bak
          </Link>
          <Link
            href="/iletisim"
            className="inline-flex h-[52px] items-center rounded-[11px] border border-ink/14 px-6 text-base font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            İletişime geç
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
