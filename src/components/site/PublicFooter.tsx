import Link from "next/link";
import { Logo } from "./Logo";

const footerColumns = [
  {
    baslik: "Akademi",
    linkler: [
      { label: "Ana sayfa", href: "/" },
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "Referanslar", href: "/referanslar" },
      { label: "Blog", href: "/blog" },
      { label: "Katılımcı yorumları", href: "/yorumlar" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },
  {
    baslik: "Eğitim",
    linkler: [
      { label: "Birebir Meta Ads Eğitimi", href: "/egitimler/meta-business" },
      { label: "Birebir Sosyal Medya Eğitimi", href: "/egitimler/sosyal-medya" },
      { label: "Yapay Zekâ Eğitimi", href: "/egitimler/yapay-zeka" },
      { label: "Tüm eğitimler", href: "/egitimler" },
      { label: "Kurumsal eğitim", href: "/kurumsal" },
    ],
  },
  {
    baslik: "Üye alanı",
    linkler: [
      { label: "Panele giriş", href: "/giris" },
      { label: "Derslerim", href: "/panel/dersler" },
      { label: "Doküman kütüphanesi", href: "/panel/dokumanlar" },
      { label: "Faturalarım", href: "/panel/hesabim" },
      { label: "Destek", href: "/panel/soru-cevap" },
    ],
  },
];

const sosyal = ["Instagram", "WhatsApp", "LinkedIn", "Telefon"];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink text-white/60">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-8 py-16 pb-7 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo variant="light" />
          <p className="mt-[18px] max-w-[280px] text-[14.5px] leading-[1.65]">
            Dijital çağın dinamiklerine uygun, birebir eğitim deneyimi. Ankara ve online.
          </p>
          <div className="mt-[22px] flex gap-[10px]">
            {sosyal.map((s) => (
              <Link
                key={s}
                href="#"
                className="inline-flex h-[34px] items-center rounded-[8px] border border-white/14 px-[13px] font-mono text-[10.5px] tracking-[0.08em] text-white/70 uppercase hover:border-brand hover:text-white"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
        {footerColumns.map((k) => (
          <div key={k.baslik}>
            <div className="font-mono text-[10.5px] tracking-[0.16em] text-white/40 uppercase">{k.baslik}</div>
            <div className="mt-[18px] flex flex-col gap-[11px]">
              {k.linkler.map((l) => (
                <Link key={l.label} href={l.href} className="text-[14.5px] text-white/65 hover:text-white">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 border-t border-white/10 px-8 py-[22px] pb-10 text-[13px]">
        <span>© 2021–2026 Ahmet Ekinci Akademi. Tüm hakları saklıdır.</span>
        <div className="flex gap-[22px]">
          <Link href="#" className="text-white/55 hover:text-white">
            Mesafeli satış sözleşmesi
          </Link>
          <Link href="#" className="text-white/55 hover:text-white">
            Gizlilik
          </Link>
          <Link href="#" className="text-white/55 hover:text-white">
            İptal &amp; iade
          </Link>
        </div>
      </div>
    </footer>
  );
}
