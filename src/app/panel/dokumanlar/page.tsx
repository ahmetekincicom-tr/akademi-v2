import { createClient } from "@/lib/supabase/server";
import { DokumanListesi, type OgrenciDokuman } from "@/components/panel/DokumanListesi";

export default async function DokumanlarPage() {
  const supabase = await createClient();
  // RLS narrows this to global files plus the ones for courses the user owns.
  const { data } = await supabase
    .from("documents")
    .select("id, baslik, dosya_yolu, dosya_tipi, boyut, created_at, courses(baslik)")
    .order("created_at", { ascending: false });

  const dokumanlar: OgrenciDokuman[] = (data ?? []).map((d) => ({
    id: d.id,
    baslik: d.baslik,
    program: (d.courses as unknown as { baslik: string } | null)?.baslik ?? "Genel",
    dosyaYolu: d.dosya_yolu,
    dosyaTipi: d.dosya_tipi ?? "",
    boyut: d.boyut,
    tarih: d.created_at,
  }));

  return <DokumanListesi dokumanlar={dokumanlar} />;
}
