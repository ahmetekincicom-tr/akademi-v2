import Link from "next/link";
import { Icon } from "@/components/Icon";

export type BreadcrumbAdim = { label: string; href?: string };

/** Every step except the last one is a working link. */
export function Breadcrumb({ adimlar }: { adimlar: BreadcrumbAdim[] }) {
  return (
    <nav aria-label="Konum" className="flex min-w-0 items-center gap-[7px] text-[12.5px]">
      {adimlar.map((a, i) => {
        const sonuncu = i === adimlar.length - 1;
        return (
          <span key={`${a.label}-${i}`} className="flex min-w-0 items-center gap-[7px]">
            {i > 0 && <Icon name="chevronRight" size={13} className="flex-none text-[#B4B9C6]" />}
            {a.href && !sonuncu ? (
              <Link
                href={a.href}
                /* Dokunmatikte dikey dolgu: kırıntı yolu 19px yüksekliğindeydi
                   ve telefonda geri dönmek için ıskalanıyordu. Farede eski
                   sıkı düzen korunuyor (pointer-fine). */
                className="truncate py-[7px] font-medium text-[#656B7A] transition hover:text-brand pointer-fine:py-0"
              >
                {a.label}
              </Link>
            ) : (
              <span className={sonuncu ? "truncate font-semibold text-ink" : "truncate text-[#656B7A]"}>
                {a.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
