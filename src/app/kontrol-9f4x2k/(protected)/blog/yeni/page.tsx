import { YaziEditoru } from "@/components/admin/YaziEditoru";
import { getSiteIcerik } from "@/lib/site-icerik";

export default async function YeniYaziPage() {
  // Varsayılan yazar: sitedeki eğitmen adı (byline). Panelden değiştirilebilir.
  const icerik = await getSiteIcerik();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Yeni yazı
      </h1>
      <div className="mt-6">
        <YaziEditoru varsayilanYazar={icerik.egitmenAd} />
      </div>
    </main>
  );
}
