import { getPanelIlanlari } from "@/lib/firsat-sorgu";
import { firsatErisimi } from "@/lib/firsat-erisim";
import { bugunTR } from "@/lib/firsat";
import { FirsatListesi } from "@/components/firsat/FirsatListesi";
import { OnizlemeUyarisi } from "@/components/firsat/OnizlemeUyarisi";

export default async function FirsatlarPage() {
  const { onizleme } = await firsatErisimi();
  const { ilanlar, kaydedilenler } = await getPanelIlanlari();

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      {onizleme && <OnizlemeUyarisi />}
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        İş fırsatları
      </h1>
      <p className="mt-2 max-w-[640px] text-[15px] leading-[1.6] text-[#5C6273]">
        Akademi ekibinin seçip paylaştığı iş, staj ve freelance fırsatları. İlgini çekenleri kaydet, başvuruyu ilanın
        kendi adresinden yap.
      </p>
      <FirsatListesi ilanlar={ilanlar} kaydedilenler={kaydedilenler} bugun={bugunTR()} />
    </main>
  );
}
