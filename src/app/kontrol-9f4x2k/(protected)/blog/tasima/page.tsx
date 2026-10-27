import Link from "next/link";
import { WpTasimaAraci } from "@/components/admin/WpTasimaAraci";

// Kopyalama turu altı görseli birden indirip yüklüyor; varsayılan süre
// yavaş bir WordPress sunucusunda yetmeyebilir.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default function TasimaPage() {
  return (
    <main className="p-4 pb-14 sm:p-7">
      <Link href="/kontrol-9f4x2k/blog" className="text-[13px] font-semibold text-brand hover:text-ink">
        ← Blog
      </Link>
      <h1 className="mt-3 font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        WordPress görsellerini taşı
      </h1>
      <p className="mt-[7px] max-w-[760px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        Yazıların içindeki görseller hâlâ eski WordPress sunucusundan geliyor. Burada onları kendi depomuza kopyalayıp
        yazılardaki adresleri güncelleyebilirsin. Her adım tekrar çalıştırılabilir; yarıda kalırsa kaldığı yerden devam
        eder. Adresleri güncellenen her yazının eski hâli sürüm geçmişinde kalır.
      </p>
      <div className="mt-6">
        <WpTasimaAraci />
      </div>
    </main>
  );
}
