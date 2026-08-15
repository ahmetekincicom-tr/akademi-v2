import { notFound } from "next/navigation";
import { getOdenecekKayit, getBanka } from "@/lib/odeme";
import { UygulamadaYok } from "@/components/panel/SadeceWeb";
import { OdemeSihirbazi } from "@/components/panel/OdemeSihirbazi";
import { iyzicoAyari } from "@/lib/iyzico";

export const dynamic = "force-dynamic";

export default async function OdemeSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [kayit, banka] = await Promise.all([getOdenecekKayit(id), getBanka()]);
  if (!kayit) notFound();

  // Anahtarlar tanımlı değilken kart seçeneği hiç gösterilmiyor; öğrenci
  // seçtikten sonra hata veren bir ekrana düşmesin.
  const kartAcik = iyzicoAyari() !== null;

  return (
    <UygulamadaYok>
      <main className="p-4 pb-14 sm:p-[34px]">
        <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
          Ödeme
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] text-[#5C6273]">
          Tutarı kontrol et, sana uyan ödeme yöntemini seç.
        </p>

        <OdemeSihirbazi
          id={kayit.id}
          tutar={kayit.tutar}
          kurs={kayit.kurs}
          not={kayit.not}
          banka={banka}
          kartAcik={kartAcik}
        />
      </main>
    </UygulamadaYok>
  );
}
