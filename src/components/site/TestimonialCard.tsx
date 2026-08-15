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
      {/* Avatar yok: elimizde katılımcı fotoğrafı yok ve yerine konan
          tarama desenli daire, yüklenememiş bir görsel gibi duruyordu.
          Ad ve unvan zaten yorumun kime ait olduğunu söylüyor. */}
      <figcaption className="mt-auto pt-6">
        <div className="text-[14.5px] font-semibold">{isim}</div>
        <div className="mt-[3px] font-mono text-[10.5px] tracking-[0.04em] text-[#656B7A]">{rol}</div>
      </figcaption>
    </figure>
  );
}
