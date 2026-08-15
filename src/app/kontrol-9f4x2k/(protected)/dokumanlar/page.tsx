import { createClient } from "@/lib/supabase/server";
import { DokumanYonetimi, type DokumanSatir } from "@/components/admin/DokumanYonetimi";

export default async function AdminDokumanlarPage() {
  const supabase = await createClient();

  const [{ data: documents }, { data: courses }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, baslik, dosya_yolu, dosya_tipi, boyut, created_at, courses(baslik)")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, baslik").order("created_at"),
  ]);

  const dokumanlar: DokumanSatir[] = (documents ?? []).map((d) => ({
    id: d.id,
    baslik: d.baslik,
    program: (d.courses as unknown as { baslik: string } | null)?.baslik ?? "Tüm öğrenciler",
    dosyaYolu: d.dosya_yolu,
    dosyaTipi: d.dosya_tipi ?? "",
    boyut: d.boyut,
    tarih: d.created_at,
  }));

  return (
    <DokumanYonetimi
      dokumanlar={dokumanlar}
      kurslar={(courses ?? []).map((c) => ({ id: c.id, ad: c.baslik }))}
    />
  );
}
