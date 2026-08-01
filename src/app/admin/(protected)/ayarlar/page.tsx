import { AyarFormu } from "@/components/admin/AyarFormu";
import { getAyarlar, siteAyarGruplari } from "@/lib/admin/ayarlar";

export default async function AdminAyarlarPage() {
  const degerler = await getAyarlar();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Ayarlar
      </h1>
      <p className="mt-[7px] max-w-[640px] text-[14.5px] text-[#5C6273]">
        Kurum bilgileri ve varsayılanlar. Yönetici yetkilerini Öğrenciler sayfasından, eğitim içeriklerini Eğitimler
        sayfasından yönetiyorsun.
      </p>

      <AyarFormu gruplar={siteAyarGruplari} degerler={degerler} />
    </main>
  );
}
