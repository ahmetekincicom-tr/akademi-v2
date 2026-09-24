import { getTumIlanlar } from "@/lib/firsat-sorgu";
import { bugunTR } from "@/lib/firsat";
import { FIRSATLAR_ACIK } from "@/lib/bolumler";
import { IlanYonetimi } from "@/components/admin/IlanYonetimi";

export default async function AdminFirsatlarPage() {
  const ilanlar = await getTumIlanlar();
  return <IlanYonetimi ilanlar={ilanlar} bugun={bugunTR()} bolumAcik={FIRSATLAR_ACIK} />;
}
