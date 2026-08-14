import { notFound } from "next/navigation";
import { getOdenecekKayit } from "@/lib/odeme";
import { UygulamadaYok } from "@/components/panel/SadeceWeb";
import { OdemeOnayi } from "@/components/panel/OdemeOnayi";

export const dynamic = "force-dynamic";

export default async function OdemeSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kayit = await getOdenecekKayit(id);
  if (!kayit) notFound();

  return (
    <UygulamadaYok>
      <main className="p-4 pb-14 sm:p-[34px]">
        <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
          Ödeme
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] text-[#5C6273]">
          Tutarı ve kapsamı kontrol et, sözleşmeyi onayladıktan sonra güvenli ödeme sayfasına geçiyorsun.
        </p>

        <OdemeOnayi id={kayit.id} tutar={kayit.tutar} kurs={kayit.kurs} not={kayit.not} />
      </main>
    </UygulamadaYok>
  );
}
