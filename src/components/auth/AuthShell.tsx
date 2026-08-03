import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { UygulamadaPasif } from "@/components/panel/SadeceWeb";

const solStats = [
  { n: "400+", t: "katılımcı" },
  { n: "5 yıl", t: "birebir eğitim" },
  { n: "24/7", t: "panel erişimi" },
];

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
    <div className="flex min-h-screen bg-paper">
      {/*
        Durum çubuğu şeridi — panel ve yönetim ekranlarındakiyle aynı. Uygulama
        tam ekran çalıştığı için saat ve piller sayfanın üstüne biniyor; arkası
        açık kalınca beyaz sistem yazısı okunmuyordu.

        Tarayıcıda env() sıfır döndüğü için yüksekliği sıfır — web değişmiyor.
      */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-[45] h-[env(safe-area-inset-top)] bg-brand" />
      <aside className="relative hidden w-[46%] max-w-[640px] flex-none flex-col justify-between overflow-hidden bg-ink p-11 px-11 pt-[calc(38px+env(safe-area-inset-top))] pb-[calc(40px+env(safe-area-inset-bottom))] text-white lg:flex">
        <div
          className="bg-grid-dark absolute inset-0"
          style={{
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(120% 80% at 25% 20%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 80% at 25% 20%, #000 30%, transparent 78%)",
          }}
        />
        <div className="absolute -bottom-50 -left-30 h-[560px] w-[560px] rounded-full bg-brand opacity-20 blur-[120px]" />

        {/* Uygulamada logo tıklanmıyor: pazarlama sitesine açılan kapı olurdu. */}
        <UygulamadaPasif>
          <Logo href="/" variant="light" subline="Öğrenci paneli" />
        </UygulamadaPasif>

        <div className="relative max-w-[460px]">
          <h2 className="font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[38px]">
            Eğitimin bittiği yerde <span className="text-brand">panel başlıyor.</span>
          </h2>
          <p className="mt-5 text-[16px] leading-[1.65] text-white/62">
            Ders kayıtların, şablonlar, birebir seans takvimin ve soru-cevap kanalı tek yerde. Katılımcı hesabınla
            giriş yap.
          </p>
          <div className="mt-[34px] rounded-[15px] border border-white/13 bg-white/4 px-6 py-[22px]">
            <div className="font-heading text-2xl leading-none text-brand">&ldquo;</div>
            <p className="mt-3 text-[15.5px] leading-[1.65] text-white/85">
              Eğitim sonrasında da her zaman destek vereceğini garanti etmesi insanı güvende hissettiriyor.
            </p>
            <div className="mt-[18px] flex items-center gap-3">
              <span className="avatar-block-dark h-[34px] w-[34px] flex-none rounded-full" />
              <span>
                <span className="block text-sm font-semibold">Seren Aker</span>
                <span className="block font-mono text-[10.5px] text-white/45">Lojistik</span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex gap-9">
          {solStats.map((s) => (
            <div key={s.t}>
              <div className="font-heading text-[22px] font-semibold tracking-[-0.025em]">{s.n}</div>
              <div className="mt-1 text-[12.5px] text-white/50">{s.t}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-end gap-4 px-6 pt-[calc(24px+env(safe-area-inset-top))] sm:px-10">
          <span className="text-sm text-[#5C6273]">{topText}</span>
          <Link
            href={topLinkHref}
            className="inline-flex h-[38px] items-center rounded-[9px] border border-ink/13 bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            {topLinkLabel}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[452px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
