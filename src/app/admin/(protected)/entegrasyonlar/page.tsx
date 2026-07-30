import { AyarFormu } from "@/components/admin/AyarFormu";
import { getAyarlar, entegrasyonGruplari } from "@/lib/admin/ayarlar";

export default async function AdminEntegrasyonlarPage() {
  const degerler = await getAyarlar();

  return (
    <main className="p-7 pb-14">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Entegrasyonlar
      </h1>
      <p className="mt-[7px] max-w-[680px] text-[14.5px] text-[#5C6273]">
        Ölçümleme, video ve ödeme sağlayıcılarının tanımlayıcılarını burada saklıyorsun. Bu bilgiler kaydedilir, ancak
        canlı olay gönderimi ve bağlantı durumu için ilgili servisin entegrasyonunun ayrıca geliştirilmesi gerekir.
      </p>

      <AyarFormu gruplar={entegrasyonGruplari} degerler={degerler} />
    </main>
  );
}
