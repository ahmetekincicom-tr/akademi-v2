import Link from "next/link";

export function CorporateStrip({ text }: { text: string }) {
  return (
    <section className="bg-brand text-white">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-9 px-8 py-9">
        <div className="flex flex-wrap items-baseline gap-5">
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-white/70 uppercase">Kurumsal</span>
          <span className="text-[18px] font-medium tracking-[-0.015em]">{text}</span>
        </div>
        <Link
          href="/kurumsal"
          className="inline-flex h-[46px] items-center gap-[9px] rounded-[10px] bg-white px-5 text-[15px] font-semibold text-brand hover:bg-ink hover:text-white"
        >
          Kurumsal eğitim planı oluştur <span>→</span>
        </Link>
      </div>
    </section>
  );
}
