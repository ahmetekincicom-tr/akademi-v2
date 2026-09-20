"use client";

import { useEffect, useMemo, useState } from "react";
import { aktifBolum, tocKaydir, type TocGrup } from "@/lib/blog-toc";

/**
 * Masaüstü sidebar İçindekiler — scroll-spy'lı.
 *
 * Varsayılan olarak yalnızca H2 gösterilir; aktif H2 grubunun altındaki H3'ler
 * (varsa) yuvalı olarak açılır — böylece liste kalabalıklaşmaz. Aktif bölüm sol
 * kenar çizgisi + koyu/kalın metinle sade biçimde vurgulanır.
 *
 * Yalnızca sunum: heading id'leri, hiyerarşisi ve içerik metni değişmiyor.
 */
export function IcindekilerYan({ gruplar }: { gruplar: TocGrup[] }) {
  const idler = useMemo(
    () => gruplar.flatMap((g) => [g.h2.id, ...g.altlar.map((a) => a.id)]),
    [gruplar],
  );
  const [aktif, setAktif] = useState<string | null>(idler[0] ?? null);

  useEffect(() => {
    let bekleyen = false;
    const guncelle = () => {
      bekleyen = false;
      setAktif(aktifBolum(idler));
    };
    const tetikle = () => {
      if (bekleyen) return;
      bekleyen = true;
      requestAnimationFrame(guncelle);
    };
    guncelle();
    window.addEventListener("scroll", tetikle, { passive: true });
    window.addEventListener("resize", tetikle);
    return () => {
      window.removeEventListener("scroll", tetikle);
      window.removeEventListener("resize", tetikle);
    };
  }, [idler]);

  // Aktif başlık hangi H2 grubunda? (H3 aktifse ebeveyn H2 grubu.)
  const aktifGrup = gruplar.findIndex(
    (g) => g.h2.id === aktif || g.altlar.some((a) => a.id === aktif),
  );

  if (gruplar.length === 0) return null;

  const tikla = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    tocKaydir(id);
    setAktif(id);
  };

  return (
    <nav aria-label="İçindekiler">
      <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#7A8092] uppercase">İçindekiler</div>
      <ul className="mt-3.5 flex flex-col gap-[3px]">
        {gruplar.map((g, gi) => {
          const grupAktif = gi === aktifGrup;
          return (
            <li key={g.h2.id}>
              <a
                href={`#${g.h2.id}`}
                onClick={(e) => tikla(e, g.h2.id)}
                aria-current={aktif === g.h2.id ? "true" : undefined}
                className={`block border-l-2 py-[6px] pl-3.5 text-[14px] leading-[1.5] transition-colors ${
                  grupAktif
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-[#6B7080] hover:border-ink/20 hover:text-ink"
                }`}
              >
                {g.h2.metin}
              </a>
              {grupAktif && g.altlar.length > 0 && (
                <ul className="mb-1 flex flex-col gap-[2px]">
                  {g.altlar.map((a) => (
                    <li key={a.id}>
                      <a
                        href={`#${a.id}`}
                        onClick={(e) => tikla(e, a.id)}
                        aria-current={aktif === a.id ? "true" : undefined}
                        className={`block border-l-2 py-[5px] pl-6 text-[13px] leading-[1.45] transition-colors ${
                          aktif === a.id
                            ? "border-brand font-medium text-ink"
                            : "border-transparent text-[#868C9C] hover:text-ink"
                        }`}
                      >
                        {a.metin}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
