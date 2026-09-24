import Link from "next/link";
import { Icon } from "@/components/Icon";

/** Bölüm öğrencilere kapalıyken yöneticinin gördüğü şerit. */
export function OnizlemeUyarisi() {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-[#C98A1B]/30 bg-[rgba(201,138,27,0.08)] px-4 py-3 text-[13.5px] text-[#7A5512]">
      <Icon name="eye" size={15} />
      <span className="flex-1">
        <strong className="font-semibold">Yönetici önizlemesi.</strong> Bu bölüm öğrencilere henüz kapalı (menüde
        &ldquo;Çok yakında&rdquo;).
      </span>
      <Link href="/kontrol-9f4x2k/firsatlar" className="font-semibold underline-offset-2 hover:underline">
        İlanları yönet
      </Link>
    </div>
  );
}
