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
      <main className="p-4 pb-14 sm:px-[34px] sm:pt-7 sm:pb-9">
        <OdemeSihirbazi
          id={kayit.id}
          tutar={kayit.tutar}
          kurs={kayit.kurs}
          not={kayit.not}
          tarih={kayit.tarih}
          banka={banka}
          kartAcik={kartAcik}
        />
      </main>
    </UygulamadaYok>
  );
}
