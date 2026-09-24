import { notFound } from "next/navigation";
import { getPanelIlani } from "@/lib/firsat-sorgu";
import { firsatErisimi } from "@/lib/firsat-erisim";
import { bugunTR } from "@/lib/firsat";
import { IlanDetay } from "@/components/firsat/IlanDetay";

export default async function IlanDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { onizleme } = await firsatErisimi();
  const { id } = await params;
  const sonuc = await getPanelIlani(id);
  // Taslak/arşiv ilanları RLS ve sorgu zaten öğrenciden gizliyor.
  if (!sonuc) notFound();

  return <IlanDetay ilan={sonuc.ilan} kayitli={sonuc.kayitli} bugun={bugunTR()} onizleme={onizleme} />;
}
