export function TestimonialCard({
  metin,
  isim,
  rol,
}: {
  metin: string;
  isim: string;
  rol: string;
}) {
  return (
    <figure className="flex flex-col rounded-[15px] border border-ink/11 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]">
      <div className="font-heading text-[26px] leading-none text-brand">&ldquo;</div>
      <blockquote className="mt-[14px] text-[15.5px] leading-[1.65] text-[#2B303D]">{metin}</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-6">
        <div className="avatar-block h-[38px] w-[38px] flex-none rounded-full" />
        <div>
          <div className="text-[14.5px] font-semibold">{isim}</div>
          <div className="font-mono text-[10.5px] tracking-[0.04em] text-[#8A8F9E]">{rol}</div>
        </div>
      </figcaption>
    </figure>
  );
}
