import { notFound } from "next/navigation";
import { getYonetimIlani } from "@/lib/firsat-sorgu";
import { IlanFormu } from "@/components/admin/IlanFormu";

export default async function IlanDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ilan = await getYonetimIlani(id);
  if (!ilan) notFound();
  return <IlanFormu key={ilan.id + ilan.guncelleme} ilan={ilan} />;
}
