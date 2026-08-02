import Link from "next/link";
import { Icon } from "@/components/Icon";

/**
 * Service worker ağ tamamen koptuğunda bu sayfayı gösteriyor. Panel sunucuda
 * render edildiği için çevrimdışı gerçek içerik gösteremiyoruz; en azından
 * boş bir tarayıcı hatası yerine kendi ekranımız çıkıyor.
 */
export const metadata = { title: "Bağlantı yok" };

export default function CevrimdisiPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-mist text-[#656B7A]">
        <Icon name="plug" size={26} />
      </span>
      <div>
        <h1 className="font-heading text-[22px] font-semibold tracking-[-0.02em]">Bağlantı yok</h1>
        <p className="mx-auto mt-2 max-w-[380px] text-[14.5px] leading-[1.6] text-[#5C6273]">
          İnternet bağlantın kesildi. Panelin içeriği canlı olarak yüklendiği için bağlantı gelince tekrar
          deneyebilirsin.
        </p>
      </div>
      <Link
        href="/panel"
        className="inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
      >
        Tekrar dene
      </Link>
    </main>
  );
}
