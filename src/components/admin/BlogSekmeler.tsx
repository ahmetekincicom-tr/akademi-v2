import Link from "next/link";

/** Yazı düzenleme başlığı altındaki sekmeler: İçerik | Performans. */
export function BlogSekmeler({ slug, aktif }: { slug: string; aktif: "icerik" | "performans" }) {
  const sekmeler = [
    { id: "icerik", ad: "İçerik", href: `/kontrol-9f4x2k/blog/${slug}/duzenle` },
    { id: "performans", ad: "Performans", href: `/kontrol-9f4x2k/blog/${slug}/performans` },
  ] as const;
  return (
    <div className="mt-4 flex gap-1 border-b border-ink/10">
      {sekmeler.map((s) => (
        <Link
          key={s.id}
          href={s.href}
          className={`-mb-px border-b-2 px-3 py-2 text-[14px] font-semibold transition ${
            aktif === s.id
              ? "border-brand text-brand"
              : "border-transparent text-[#5C6273] hover:text-ink"
          }`}
        >
          {s.ad}
        </Link>
      ))}
    </div>
  );
}
